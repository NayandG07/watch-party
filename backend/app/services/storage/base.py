"""
Abstract base class for storage providers.
"""

from abc import ABC, abstractmethod
from typing import Any


class StorageProviderBase(ABC):
    """
    Abstract interface for all supported object storage backends.
    
    Subclasses must implement these methods using the provided credentials
    (which are decrypted by the application before being passed here).
    """

    def __init__(self, credentials: dict[str, str], bucket_name: str, endpoint_url: str | None = None, cdn_url: str | None = None):
        self.credentials = credentials
        self.bucket_name = bucket_name
        self.endpoint_url = endpoint_url
        self.cdn_url = cdn_url

    @abstractmethod
    async def generate_signed_url(self, path: str, expires_in_seconds: int = 3600) -> str:
        """
        Generate a pre-signed GET URL for the given object path.
        If the provider has a cdn_url configured, the returned URL should point to the CDN.
        """
        pass

    @abstractmethod
    async def delete_object(self, path: str) -> None:
        """
        Delete an object at the given path.
        """
        pass

    @abstractmethod
    async def list_objects(self, prefix: str) -> list[dict[str, Any]]:
        """
        List objects under a specific prefix.
        Should return a list of dicts containing at least 'key' and 'size'.
        """
        pass
