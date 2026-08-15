"""
Shared utilities for S3-compatible storage providers.

Each provider stores credentials in a slightly different JSON shape:
  B2      → {"key_id": ..., "application_key": ...}
  R2/S3   → {"access_key_id": ..., "secret_access_key": ...}

Use extract_s3_creds() to normalize them into a single (key_id, secret) pair
that can be passed directly to boto3 / aioboto3.
"""
from __future__ import annotations


def extract_s3_creds(provider_type: str, creds: dict) -> tuple[str, str]:
    """Return (access_key_id, secret_access_key) for any supported provider.

    Args:
        provider_type: One of "b2", "r2", "s3", "minio"
        creds: Decrypted credentials dict from the database

    Returns:
        (access_key_id, secret_access_key) tuple ready for boto3
    """
    if provider_type == "b2":
        return creds["key_id"], creds["application_key"]
    # r2, s3, minio all use the standard S3 naming
    return creds["access_key_id"], creds["secret_access_key"]
