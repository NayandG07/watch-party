"""
Backblaze B2 storage provider implementation.
Uses the standard S3 compatibility layer.
"""

import aioboto3
from botocore.exceptions import ClientError

from app.services.storage.base import StorageProviderBase


class B2StorageProvider(StorageProviderBase):
    """
    Implementation of StorageProviderBase for Backblaze B2 using its S3-compatible API.
    
    Expects credentials format:
    {
        "key_id": "...",          # Maps to aws_access_key_id
        "application_key": "..."  # Maps to aws_secret_access_key
    }
    """
    
    def __init__(self, credentials: dict[str, str], bucket_name: str, endpoint_url: str | None = None, cdn_url: str | None = None):
        super().__init__(credentials, bucket_name, endpoint_url, cdn_url)
        # For B2 S3 API, endpoint_url is required.
        if not self.endpoint_url:
            raise ValueError("endpoint_url is required for B2StorageProvider")
            
        self._session = aioboto3.Session(
            aws_access_key_id=self.credentials.get("key_id"),
            aws_secret_access_key=self.credentials.get("application_key"),
            region_name="us-east-1" # B2 accepts arbitrary regions, or specify if needed
        )

    async def generate_signed_url(self, path: str, expires_in_seconds: int = 3600) -> str:
        async with self._session.client("s3", endpoint_url=self.endpoint_url) as s3_client:
            url = await s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket_name, "Key": path},
                ExpiresIn=expires_in_seconds,
            )
            
            # If a CDN is configured, rewrite the URL domain
            if self.cdn_url:
                from urllib.parse import urlparse, urlunparse
                parsed_url = urlparse(url)
                parsed_cdn = urlparse(self.cdn_url)
                
                # S3 sometimes puts the bucket in the hostname (bucket.endpoint.com),
                # sometimes in the path (/bucket/... depending on virtual hosting config).
                # B2 S3 generate_presigned_url usually formats as https://endpoint/bucket/path
                
                # Replace scheme and netloc with CDN
                new_parts = (
                    parsed_cdn.scheme,
                    parsed_cdn.netloc,
                    parsed_url.path, # Keep the path (which may include the bucket name depending on how Cloudflare is set up, this might need refinement based on exact CDN config)
                    parsed_url.params,
                    parsed_url.query,
                    parsed_url.fragment
                )
                url = urlunparse(new_parts)
                
            return url

    async def delete_object(self, path: str) -> None:
        async with self._session.client("s3", endpoint_url=self.endpoint_url) as s3_client:
            await s3_client.delete_object(Bucket=self.bucket_name, Key=path)

    async def list_objects(self, prefix: str) -> list[dict[str, str | int]]:
        results = []
        async with self._session.client("s3", endpoint_url=self.endpoint_url) as s3_client:
            paginator = s3_client.get_paginator("list_objects_v2")
            async for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
                for obj in page.get("Contents", []):
                    results.append({
                        "key": obj["Key"],
                        "size": obj["Size"]
                    })
        return results
