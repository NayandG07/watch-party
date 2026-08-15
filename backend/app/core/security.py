"""
Security utilities: JWT, bcrypt, AES-256-GCM encryption, HLS key signing.

Design decisions:
- Session JWTs are now issued by Supabase Auth and validated using SUPABASE_JWT_SECRET.
- Action tokens (ws, hls_key, stream, invite) are still signed locally with SECRET_KEY.
- Storage provider credentials are encrypted with AES-256-GCM before DB storage.
  The nonce is prepended to the ciphertext and the whole thing is base64url-encoded.
- HLS encryption keys are signed with a separate secret so they can be validated
  independently of user session tokens (the HLS.js player fetches them per-segment).
"""

from __future__ import annotations

import base64
import os
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()

# ── Password hashing ──────────────────────────────────────────────────────────


def hash_password(password: str) -> str:
    """Return a bcrypt hash of *password*."""
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("ascii")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if *plain_password* matches *hashed_password*."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("ascii"))
    except ValueError:
        return False


# ── Supabase Session JWT ──────────────────────────────────────────────────────

# Cache the JWKS so we don't fetch on every request.
# Key: supabase_url, Value: list of JWK dicts
_jwks_cache: dict[str, list[dict]] = {}


async def _fetch_jwks() -> list[dict]:
    """Fetch Supabase's JWKS, with in-memory caching. Returns [] on any error."""
    if not settings.supabase_url:
        return []

    if settings.supabase_url in _jwks_cache:
        return _jwks_cache[settings.supabase_url]

    try:
        import httpx
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(jwks_url)
            resp.raise_for_status()
            keys = resp.json().get("keys", [])
        _jwks_cache[settings.supabase_url] = keys
        return keys
    except Exception as exc:
        import structlog
        structlog.get_logger().warning("jwks_fetch_failed", error=str(exc))
        return []


def _peek_alg(token: str) -> str:
    """Extract the 'alg' field from a JWT header without validating."""
    import base64
    import json as _json
    try:
        seg = token.split(".")[0]
        padded = seg + "=" * (4 - len(seg) % 4)
        return _json.loads(base64.urlsafe_b64decode(padded)).get("alg", "HS256")
    except Exception:
        return "HS256"


def decode_supabase_token(token: str) -> dict[str, Any]:
    """Validate a Supabase HS256 token using the JWT secret (sync, legacy)."""
    try:
        alg = _peek_alg(token)
        if alg != "HS256":
            raise JWTError(f"Algorithm {alg} requires async validation")
        return jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
    except JWTError:
        raise
    except Exception as exc:
        raise JWTError(str(exc)) from exc


async def decode_supabase_token_async(token: str) -> dict[str, Any]:
    """Validate a Supabase JWT — supports both HS256 and RS256.

    - HS256: validated with SUPABASE_JWT_SECRET (symmetric).
    - RS256: validated using public keys from Supabase's JWKS endpoint.

    All exceptions are normalised to JWTError so callers always get a 401.
    """
    try:
        alg = _peek_alg(token)

        if alg == "HS256":
            return jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")

        # RS256 / asymmetric — use JWKS public keys
        keys = await _fetch_jwks()
        if not keys:
            raise JWTError(
                "Could not fetch Supabase JWKS. "
                "Ensure SUPABASE_URL is set and the Supabase project is reachable."
            )

        last_exc: Exception = JWTError("No matching JWKS key found for this token")
        for jwk_key in keys:
            try:
                # python-jose accepts JWK dicts directly for RSA keys
                return jwt.decode(token, jwk_key, algorithms=[alg], audience="authenticated")
            except JWTError as exc:
                last_exc = exc
            except Exception as exc:
                last_exc = JWTError(str(exc))

        raise last_exc

    except JWTError:
        raise
    except Exception as exc:
        # Catch-all: never let a non-JWTError escape and cause a 500
        raise JWTError(f"Token validation error: {exc}") from exc



# ── Action token helpers (kept for ws, hls, stream, invite) ────────────────────


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate an action JWT (ws/hls/stream/invite) signed by SECRET_KEY.

    Raises:
        jose.JWTError: If the token is invalid, expired, or has a bad signature.
    """
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


# ── WebSocket one-time tokens ─────────────────────────────────────────────────


def create_ws_token(user_id: str, room_id: str) -> str:
    """Create a short-lived token for WebSocket upgrade authentication.

    Standard HTTP cookies are not always forwarded on WS upgrades (especially
    across CDN/proxy boundaries). This token is passed as a query param.
    It expires in 60 seconds — long enough to open the connection.
    """
    expire = datetime.now(UTC) + timedelta(minutes=5)
    payload: dict[str, Any] = {
        "sub": user_id,
        "room_id": room_id,
        "exp": expire,
        "type": "ws",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_ws_token(token: str) -> dict[str, Any]:
    """Decode a WebSocket token. Raises JWTError on failure."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    if payload.get("type") != "ws":
        raise JWTError("Invalid token type for WebSocket")
    return payload


# ── AES-256-GCM encryption (storage provider credentials) ────────────────────

_GCM_NONCE_SIZE = 12  # 96-bit nonce, recommended for GCM


def _get_aes_key() -> bytes:
    """Decode the base64url-encoded 32-byte AES-256 key from settings.

    Raises:
        ValueError: If the decoded key is not exactly 32 bytes.
    """
    try:
        key_bytes = base64.urlsafe_b64decode(settings.encryption_key + "==")  # pad for safety
    except Exception as exc:
        raise ValueError("ENCRYPTION_KEY is not valid base64url encoding") from exc

    if len(key_bytes) != 32:
        raise ValueError(
            f"ENCRYPTION_KEY must decode to exactly 32 bytes (got {len(key_bytes)}). "
            'Generate with: python -c "import secrets,base64; '
            'print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"'
        )
    return key_bytes


def encrypt_secret(plaintext: str) -> str:
    """Encrypt a plaintext secret with AES-256-GCM.

    The output is ``nonce || ciphertext`` base64url-encoded.
    A fresh nonce is generated for every call (GCM requires unique nonces).

    Args:
        plaintext: Sensitive string to encrypt (e.g. B2 application key).

    Returns:
        Base64url-encoded encrypted blob.
    """
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(_GCM_NONCE_SIZE)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.urlsafe_b64encode(nonce + ciphertext).decode("ascii")


def decrypt_secret(encrypted: str) -> str:
    """Decrypt an AES-256-GCM encrypted blob produced by :func:`encrypt_secret`.

    Args:
        encrypted: Base64url-encoded ``nonce || ciphertext`` string.

    Returns:
        Original plaintext string.

    Raises:
        ValueError: If decryption fails (bad key, corrupted data, or tampering).
    """
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    try:
        data = base64.urlsafe_b64decode(encrypted + "==")
        nonce, ciphertext = data[:_GCM_NONCE_SIZE], data[_GCM_NONCE_SIZE:]
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode("utf-8")
    except InvalidTag as exc:
        raise ValueError("Decryption failed — data may be corrupt or tampered") from exc
    except Exception as exc:
        raise ValueError(f"Decryption error: {exc}") from exc


# ── HLS AES-128 key signing ───────────────────────────────────────────────────


def create_hls_key_token(movie_id: str, user_id: str) -> str:
    """Create a token authorizing the bearer to fetch a movie's HLS AES-128 key.

    HLS.js will request this token in the Authorization header when the player
    fetches the ``#EXT-X-KEY`` URI from the backend.
    Expires at the same time as the access token to keep sessions consistent.
    """
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": user_id,
        "movie_id": movie_id,
        "exp": expire,
        "type": "hls_key",
    }
    return jwt.encode(payload, settings.hls_key_signing_secret, algorithm=settings.algorithm)


def decode_hls_key_token(token: str) -> dict[str, Any]:
    """Validate and decode an HLS key token.

    Raises:
        jose.JWTError: If the token is invalid or expired.
    """
    payload = jwt.decode(token, settings.hls_key_signing_secret, algorithms=[settings.algorithm])
    if payload.get("type") != "hls_key":
        raise JWTError("Invalid token type for HLS key")
    return payload


def create_stream_token(movie_id: str, user_id: str) -> str:
    """Create a short-lived token for proxied movie assets and playlists."""
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": user_id,
        "movie_id": movie_id,
        "exp": expire,
        "type": "stream",
    }
    return jwt.encode(payload, settings.hls_key_signing_secret, algorithm=settings.algorithm)


def decode_stream_token(token: str) -> dict[str, Any]:
    """Validate and decode a proxied stream/asset token."""
    payload = jwt.decode(token, settings.hls_key_signing_secret, algorithms=[settings.algorithm])
    if payload.get("type") != "stream":
        raise JWTError("Invalid token type for stream")
    return payload


# ── Invite token ──────────────────────────────────────────────────────────────


def create_invite_token(
    invited_by: str,
    expires_in_hours: int = 48,
    room_id: str | None = None,
) -> str:
    """Create a signed invitation token.

    Used for both platform registration invites and room join invites.
    The token is stored in the DB (Invite table) and validated on use.
    """
    expire = datetime.now(UTC) + timedelta(hours=expires_in_hours)
    payload: dict[str, Any] = {
        "sub": invited_by,
        "exp": expire,
        "type": "invite",
    }
    if room_id:
        payload["room_id"] = room_id
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_invite_token(token: str) -> dict[str, Any]:
    """Validate and decode an invite token. Raises JWTError on failure."""
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    if payload.get("type") != "invite":
        raise JWTError("Invalid token type for invite")
    return payload
