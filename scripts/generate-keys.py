#!/usr/bin/env python3
"""
Generate all required cryptographic secrets for Watch Party.

Run this once when setting up a new environment:
    python scripts/generate-keys.py

Then copy the output into your .env file.
"""

import base64
import secrets


def generate_hex(bytes_count: int = 32) -> str:
    return secrets.token_hex(bytes_count)


def generate_base64_key(bytes_count: int = 32) -> str:
    return base64.urlsafe_b64encode(secrets.token_bytes(bytes_count)).decode()


if __name__ == "__main__":
    print("=" * 60)
    print("  Watch Party — Generated Secrets")
    print("  Copy these into your .env / docker/.env file.")
    print("  Keep them private. Do NOT commit them.")
    print("=" * 60)
    print()
    print(f"SECRET_KEY={generate_hex(32)}")
    print()
    print(f"ENCRYPTION_KEY={generate_base64_key(32)}")
    print()
    print(f"HLS_KEY_SIGNING_SECRET={generate_hex(32)}")
    print()
    print("=" * 60)
    print("  Regenerate if any secret is ever compromised.")
    print("=" * 60)
