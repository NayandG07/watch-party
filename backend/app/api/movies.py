import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import json
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from starlette.responses import RedirectResponse
import boto3
from botocore.client import Config
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import Settings, get_settings
from app.core.dependencies import CurrentUserRoleDep, DatabaseDep, RequireAdminDep, RequireLevel2Dep
from app.core.security import create_hls_key_token, decrypt_secret
from app.models.collection import Collection
from app.models.library import Library
from app.models.movie import Movie
from app.services.permission import PermissionService
from app.schemas.movie import (
    MovieBrief,
    MovieCreate,
    MovieResponse,
    MovieUpdate,
    MovieUploaderUpdate,
    PlaybackTokenResponse,
)

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("", response_model=list[MovieBrief])
async def list_movies(
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
    collection_id: uuid.UUID | None = Query(None, description="Filter by collection ID"),
) -> list[Movie]:
    user_id, user_role = user_role_pair
    stmt = (
        select(Movie)
        .options(selectinload(Movie.collection).selectinload(Collection.library))
        .order_by(Movie.created_at.desc())
    )
    if collection_id:
        stmt = stmt.where(Movie.collection_id == collection_id)
        
    result = await db.execute(stmt)
    all_movies = list(result.scalars().all())

    return await PermissionService.batch_filter_visible_movies(
        movies=all_movies,
        user_id=user_id,
        user_role=user_role,
        db=db,
    )


@router.post("", response_model=MovieResponse, status_code=status.HTTP_201_CREATED)
async def create_movie(
    payload: MovieCreate,
    _: RequireLevel2Dep,
    db: DatabaseDep,
) -> Movie:
    # Generate a URL-safe slug from the title, appending part of a UUID for uniqueness
    base_slug = re.sub(r"[^a-z0-9]+", "-", payload.title.lower()).strip("-")
    slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"

    new_movie = Movie(
        collection_id=payload.collection_id,
        title=payload.title,
        slug=slug,
        description=payload.description,
        year=payload.year,
        visibility_override=payload.visibility_override,
        external_ids=payload.external_ids,
    )
    db.add(new_movie)
    await db.commit()
    
    # Reload with full relation chain needed for MovieResponse
    stmt = (
        select(Movie)
        .where(Movie.id == new_movie.id)
        .options(
            selectinload(Movie.collection)
            .selectinload(Collection.library)
            .selectinload(Library.owner)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/{movie_id}", response_model=MovieResponse)
async def get_movie(
    movie_id: uuid.UUID,
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
) -> Movie:
    user_id, user_role = user_role_pair
    stmt = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(
            selectinload(Movie.collection)
            .selectinload(Collection.library)
            .selectinload(Library.owner)
        )
    )
    result = await db.execute(stmt)
    movie = result.scalar_one_or_none()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    if not await PermissionService.can_view_movie(
        movie=movie,
        collection=movie.collection,
        library=movie.collection.library,
        user_id=user_id,
        user_role=user_role,
        db=db,
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    return movie


@router.patch("/{movie_id}", response_model=MovieResponse)
async def update_movie(
    movie_id: uuid.UUID,
    payload: MovieUpdate,
    _: RequireAdminDep,
    db: DatabaseDep,
) -> Movie:
    stmt = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(selectinload(Movie.collection).selectinload("library"))
    )
    result = await db.execute(stmt)
    movie = result.scalar_one_or_none()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "enriched_metadata" in update_data and update_data["enriched_metadata"]:
        movie.enriched_metadata = {**(movie.enriched_metadata or {}), **update_data["enriched_metadata"]}
        del update_data["enriched_metadata"]

    for key, value in update_data.items():
        setattr(movie, key, value)

    await db.commit()

    # Re-query with full relation chain for serialization
    stmt = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(
            selectinload(Movie.collection)
            .selectinload(Collection.library)
            .selectinload(Library.owner)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.patch("/{movie_id}/upload-complete", response_model=MovieResponse)
async def complete_movie_upload(
    movie_id: uuid.UUID,
    payload: MovieUploaderUpdate,
    _: RequireAdminDep,
    db: DatabaseDep,
) -> Movie:
    stmt = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(
            selectinload(Movie.collection)
            .selectinload(Collection.library)
            .selectinload(Library.owner)
        )
    )
    result = await db.execute(stmt)
    movie = result.scalar_one_or_none()
    
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    update_data = payload.model_dump(exclude_unset=True)

    # In a real app we'd also store the HLS key hex, but that needs to be encrypted before saving.
    # The security module has AES-256-GCM encryption we can use, but HLS Keys are in a separate table.
    # For now, we will just update the movie fields. Let's add the HLS Key logic.
    from app.models.hls_key import HLSKey
    from app.core.security import encrypt_secret

    # Encrypt the HLS AES-128 key (but leave the IV plaintext as it's not secret)
    key_hex = update_data.pop("hls_key_hex")
    iv_hex = update_data.pop("hls_iv_hex")
    
    enc_key = encrypt_secret(key_hex)

    new_hls_key = HLSKey(
        movie_id=movie.id,
        key_encrypted=enc_key,
        iv_hex=iv_hex
    )
    db.add(new_hls_key)

    for key, value in update_data.items():
        if hasattr(movie, key):
            setattr(movie, key, value)

    await db.commit()

    # Re-query with full relation chain for serialization
    stmt = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(
            selectinload(Movie.collection)
            .selectinload(Collection.library)
            .selectinload(Library.owner)
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(
    movie_id: uuid.UUID,
    _: RequireAdminDep,
    db: DatabaseDep,
) -> None:
    movie = await db.get(Movie, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
        
    await db.delete(movie)
    await db.commit()


@router.get("/{movie_id}/hls-key-token", response_model=PlaybackTokenResponse)
async def get_hls_key_token(
    request: Request,
    movie_id: uuid.UUID,
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> PlaybackTokenResponse:
    user_id, user_role = user_role_pair

    # 1. Fetch movie with full hierarchy
    stmt = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(
            selectinload(Movie.collection)
            .selectinload(Collection.library)
            .selectinload(Library.storage_provider)
        )
    )
    result = await db.execute(stmt)
    movie = result.scalar_one_or_none()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    # 2. Enforce permission check
    if not await PermissionService.can_play_movie(
        movie=movie,
        collection=movie.collection,
        library=movie.collection.library,
        user_id=user_id,
        user_role=user_role,
        db=db,
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    # 3. Ensure movie is processed and uploaded
    if not movie.is_processed or not movie.is_uploaded or not movie.hls_master_path:
        raise HTTPException(status_code=400, detail="Movie is not fully processed yet")

    # 4. Create signed token for HLS key access
    token = create_hls_key_token(movie_id=str(movie.id), user_id=user_id)
    
    # Expires in the same time as the access token
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)

    # In a production scenario, the StorageProvider should have a cdn_url configured
    # to proxy the B2 bucket via Cloudflare.
    sp = movie.collection.library.storage_provider
    if sp.cdn_url:
        base_url = sp.cdn_url.rstrip("/")
        hls_url = f"{base_url}/{movie.hls_master_path}"
    else:
        # Fallback for private buckets / local dev: route through the backend proxy route.
        # This will return a 302 Redirect to a presigned S3 URL.
        api_base = str(request.base_url).rstrip("/")
        hls_url = f"{api_base}/api/movies/{movie.id}/stream/master.m3u8"

    return PlaybackTokenResponse(
        hls_url=hls_url,
        hls_key_token=token,
        expires_at=expires_at,
    )



@router.get("/{movie_id}/stream/{file_path:path}")
async def stream_movie_file(
    request: Request,
    movie_id: uuid.UUID,
    file_path: str,
    db: DatabaseDep,
):
    """
    Backend streaming proxy for private B2 buckets.

    For .m3u8 playlists: downloads from S3, rewrites all segment URIs and the
    EXT-X-KEY URI so they point back to this proxy endpoint, then returns the
    rewritten text. This keeps every request (segments + key) inside our
    auth perimeter.

    For .ts segments and other binary files: redirects to a short-lived
    presigned S3 URL (the browser handles the redirect seamlessly).
    """
    stmt = (
        select(Movie)
        .where(Movie.id == movie_id)
        .options(
            selectinload(Movie.collection)
            .selectinload(Collection.library)
            .selectinload(Library.storage_provider)
        )
    )
    result = await db.execute(stmt)
    movie = result.scalar_one_or_none()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    sp = movie.collection.library.storage_provider
    creds = json.loads(decrypt_secret(sp.credentials_encrypted))

    s3 = boto3.client(
        "s3",
        endpoint_url=sp.endpoint_url,
        aws_access_key_id=creds["key_id"],
        aws_secret_access_key=creds["application_key"],
        config=Config(signature_version="s3v4"),
    )

    # movie.hls_master_path is like "movies/UUID/hls/master.m3u8"
    # derive the HLS directory prefix "movies/UUID/hls"
    base_dir = movie.hls_master_path.rsplit("/", 1)[0]
    s3_key = f"{base_dir}/{file_path}"

    if file_path.endswith(".m3u8"):
        # ── Rewriting proxy for playlists ─────────────────────────────────────
        # Download the raw playlist text from S3 using a presigned URL
        presigned = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": sp.bucket_name, "Key": s3_key},
            ExpiresIn=300,
        )
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.get(presigned)
            if r.status_code != 200:
                raise HTTPException(status_code=502, detail="Failed to fetch playlist from storage")
            playlist_text = r.text

        # Build the base URL for this proxy so we can rewrite relative URIs
        # e.g. "http://localhost:8000/api/movies/<uuid>/stream/"
        proxy_base = str(request.url).rsplit("/", 1)[0] + "/"

        rewritten_lines = []
        for line in playlist_text.splitlines():
            line = line.strip()
            if line.startswith("#EXT-X-KEY:"):
                # Rewrite URI="watchparty://key" → our /hls-key endpoint
                line = re.sub(
                    r'URI="[^"]*"',
                    f'URI="{str(request.base_url).rstrip("/")}/api/movies/{movie_id}/hls-key"',
                    line,
                )
            elif line and not line.startswith("#"):
                # Relative segment filename → absolute proxy URL
                # e.g. "seg_000.ts" → "http://localhost:8000/api/movies/<uuid>/stream/seg_000.ts"
                if not line.startswith("http"):
                    line = proxy_base + line
            rewritten_lines.append(line)

        from starlette.responses import PlainTextResponse
        return PlainTextResponse(
            "\n".join(rewritten_lines),
            media_type="application/vnd.apple.mpegurl",
        )

    else:
        # ── Redirect for binary files (.ts segments, images, etc.) ───────────
        presigned = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": sp.bucket_name, "Key": s3_key},
            ExpiresIn=3600,
        )
        return RedirectResponse(presigned)


@router.get("/{movie_id}/hls-key")
async def serve_hls_key(
    movie_id: uuid.UUID,
    db: DatabaseDep,
    token: str | None = Query(None),
    authorization: str | None = None,
):
    """
    Serve the raw 16-byte AES-128 encryption key for HLS playback.

    The player sends the token (issued by /hls-key-token) either as a
    query parameter `?token=...` or in the Authorization header.
    We validate it and return the raw key bytes so the player can decrypt
    the video segments.
    """
    from app.core.security import decode_hls_key_token
    from app.models.hls_key import HLSKey
    from starlette.responses import Response
    from jose import JWTError

    # Accept token from query param or Authorization header
    raw_token = token
    if not raw_token and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            raw_token = parts[1]

    if not raw_token:
        raise HTTPException(status_code=401, detail="Missing HLS key token")

    try:
        payload = decode_hls_key_token(raw_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired HLS key token")

    # Verify the token is for THIS movie
    if payload.get("movie_id") != str(movie_id):
        raise HTTPException(status_code=403, detail="Token does not match this movie")

    # Fetch the encrypted key from the DB
    stmt = select(HLSKey).where(HLSKey.movie_id == movie_id)
    result = await db.execute(stmt)
    hls_key = result.scalar_one_or_none()
    if not hls_key:
        raise HTTPException(status_code=404, detail="HLS key not found for this movie")

    # Decrypt and return raw bytes
    key_hex = decrypt_secret(hls_key.key_encrypted)
    key_bytes = bytes.fromhex(key_hex)

    return Response(
        content=key_bytes,
        media_type="application/octet-stream",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
        },
    )
