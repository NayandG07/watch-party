"""
Permission service — central access-control logic.

Resolution order (most specific wins):
  1. super_admin → always True
  2. Resource owner → always True  
  3. Movie visibility_override (if set)
  4. Collection visibility
  5. Library is_private

Explicit grants (Permission table) are checked for FRIENDS-level resources.
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole, Visibility
from app.models.permission import Permission

if TYPE_CHECKING:
    from app.models.collection import Collection
    from app.models.library import Library
    from app.models.movie import Movie


class PermissionService:
    """Central permissions engine. All methods are async to allow DB lookups."""

    # ── Library ──────────────────────────────────────────────────────────────

    @staticmethod
    async def can_view_library(
        library: "Library",
        user_id: str,
        user_role: str,
        db: AsyncSession,
    ) -> bool:
        """Check if user can view (read) the library and its contents."""
        # 1. Admin bypass
        if user_role == UserRole.SUPER_ADMIN:
            return True

        # 2. Owner bypass
        if str(library.owner_id) == user_id:
            return True

        # 3. If not private → all authenticated users can see it
        if not library.is_private:
            return True

        # 4. Check for explicit grant on this library
        return await PermissionService._has_explicit_grant(
            user_id=user_id,
            db=db,
            library_id=library.id,
        )

    @staticmethod
    async def can_manage_library(
        library: "Library",
        user_id: str,
        user_role: str,
    ) -> bool:
        """Check if user can mutate (update/delete) the library."""
        if user_role == UserRole.SUPER_ADMIN:
            return True
        return str(library.owner_id) == user_id

    # ── Collection ────────────────────────────────────────────────────────────

    @staticmethod
    async def can_view_collection(
        collection: "Collection",
        library: "Library",
        user_id: str,
        user_role: str,
        db: AsyncSession,
    ) -> bool:
        """Check if user can view this collection."""
        if user_role == UserRole.SUPER_ADMIN:
            return True

        # Owner of the library owns all collections within it
        if str(library.owner_id) == user_id:
            return True

        # If the parent library is private, user must have a library-level grant
        if library.is_private:
            library_grant = await PermissionService._has_explicit_grant(
                user_id=user_id, db=db, library_id=library.id,
            )
            if not library_grant:
                return False

        # Now check the collection's own visibility
        if collection.visibility == Visibility.SHARED:
            return True
        elif collection.visibility == Visibility.FRIENDS:
            return await PermissionService._has_explicit_grant(
                user_id=user_id, db=db, collection_id=collection.id,
            )
        else:  # PRIVATE
            return await PermissionService._has_explicit_grant(
                user_id=user_id, db=db, collection_id=collection.id,
            )

    @staticmethod
    async def can_manage_collection(
        collection: "Collection",
        library: "Library",
        user_id: str,
        user_role: str,
    ) -> bool:
        """Check if user can mutate this collection."""
        if user_role == UserRole.SUPER_ADMIN:
            return True
        return str(library.owner_id) == user_id

    # ── Movie ─────────────────────────────────────────────────────────────────

    @staticmethod
    async def can_view_movie(
        movie: "Movie",
        collection: "Collection",
        library: "Library",
        user_id: str,
        user_role: str,
        db: AsyncSession,
    ) -> bool:
        """Check if user can view (list / fetch metadata) this movie."""
        if user_role == UserRole.SUPER_ADMIN:
            return True

        if str(library.owner_id) == user_id:
            return True

        # Check movie-level explicit grant first (most specific)
        movie_grant = await PermissionService._has_explicit_grant(
            user_id=user_id, db=db, movie_id=movie.id,
        )
        if movie_grant:
            return True

        # Determine effective visibility (movie override → collection visibility)
        effective_visibility = movie.visibility_override or collection.visibility

        if effective_visibility == Visibility.SHARED:
            # Still need parent library to be accessible
            return not library.is_private or await PermissionService._has_explicit_grant(
                user_id=user_id, db=db, library_id=library.id,
            )
        elif effective_visibility == Visibility.FRIENDS:
            # Must have collection-level or movie-level grant (already checked movie above)
            return await PermissionService._has_explicit_grant(
                user_id=user_id, db=db, collection_id=collection.id,
            )
        else:  # PRIVATE
            return False

    @staticmethod
    async def can_play_movie(
        movie: "Movie",
        collection: "Collection",
        library: "Library",
        user_id: str,
        user_role: str,
        db: AsyncSession,
    ) -> bool:
        """Playback uses the same rules as view access."""
        return await PermissionService.can_view_movie(
            movie=movie,
            collection=collection,
            library=library,
            user_id=user_id,
            user_role=user_role,
            db=db,
        )

    @staticmethod
    async def can_manage_movie(
        library: "Library",
        user_id: str,
        user_role: str,
    ) -> bool:
        """Only library owner or admin can mutate a movie."""
        if user_role == UserRole.SUPER_ADMIN:
            return True
        return str(library.owner_id) == user_id

    # ── Internal helpers ──────────────────────────────────────────────────────

    @staticmethod
    async def _has_explicit_grant(
        user_id: str,
        db: AsyncSession,
        library_id: uuid.UUID | None = None,
        collection_id: uuid.UUID | None = None,
        movie_id: uuid.UUID | None = None,
    ) -> bool:
        """Check if there is an explicit Permission row for this user + target."""
        stmt = select(Permission).where(
            Permission.grantee_id == uuid.UUID(user_id)
        )

        if library_id is not None:
            stmt = stmt.where(Permission.library_id == library_id)
        elif collection_id is not None:
            stmt = stmt.where(Permission.collection_id == collection_id)
        elif movie_id is not None:
            stmt = stmt.where(Permission.movie_id == movie_id)
        else:
            return False

        result = await db.execute(stmt.limit(1))
        return result.scalar_one_or_none() is not None
