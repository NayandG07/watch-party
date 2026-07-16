"""
Permission service — central access-control logic.

Resolution order (most specific wins):
  1. super_admin → always True
  2. Resource owner → always True  
  3. Movie visibility_override (if set)
  4. Collection visibility
  5. Library is_private

Explicit grants (Permission table) are checked for FRIENDS-level resources.

Performance notes:
  - `batch_filter_visible_*` methods collapse N+1 per-item permission checks
    into a single DB query per request — critical for list endpoints.
  - Super-admin / owner short-circuits before hitting the DB at all.
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

    # ── Batch list filtering (eliminates N+1 per-row permission queries) ──────

    @staticmethod
    async def batch_filter_visible_collections(
        collections: "list[Collection]",
        user_id: str,
        user_role: str,
        db: AsyncSession,
    ) -> "list[Collection]":
        """Filter a list of collections to only those visible to the user.

        Replaces a per-collection ``can_view_collection`` loop with at most
        two DB queries regardless of how many collections are in the list.

        Algorithm:
          1. Super-admin / owner short-circuit: no DB hit at all.
          2. Fetch all of the user's explicit grants in one query.
          3. Apply visibility rules in Python using the pre-fetched grant set.
        """
        if not collections:
            return []

        # Super-admin sees everything
        if user_role == UserRole.SUPER_ADMIN:
            return collections

        # Build the set of library_ids the user owns
        user_uuid = uuid.UUID(user_id)

        # Collect all unique library_ids and collection_ids for batch grant lookup
        library_ids = {c.library.id for c in collections if c.library is not None}
        collection_ids = {c.id for c in collections}

        # Single query: fetch all explicit grants for this user touching any of these resources
        grants_q = select(Permission).where(
            Permission.grantee_id == user_uuid,
        )
        result = await db.execute(grants_q)
        all_grants = result.scalars().all()

        granted_library_ids: set[uuid.UUID] = {g.library_id for g in all_grants if g.library_id}
        granted_collection_ids: set[uuid.UUID] = {g.collection_id for g in all_grants if g.collection_id}

        visible: list[Collection] = []
        for col in collections:
            lib = col.library
            if lib is None:
                continue

            # Owner of the library sees all its collections
            if str(lib.owner_id) == user_id:
                visible.append(col)
                continue

            # Private library: must have a library-level grant
            if lib.is_private and lib.id not in granted_library_ids:
                continue

            # Check collection-level visibility
            if col.visibility == Visibility.SHARED:
                visible.append(col)
            elif col.visibility in (Visibility.FRIENDS, Visibility.PRIVATE):
                if col.id in granted_collection_ids:
                    visible.append(col)

        return visible

    @staticmethod
    async def batch_filter_visible_movies(
        movies: "list[Movie]",
        user_id: str,
        user_role: str,
        db: AsyncSession,
    ) -> "list[Movie]":
        """Filter a list of movies to only those visible to the user.

        Same approach as ``batch_filter_visible_collections``:
        one DB round-trip for all grants instead of one per movie.
        """
        if not movies:
            return []

        if user_role == UserRole.SUPER_ADMIN:
            return movies

        user_uuid = uuid.UUID(user_id)

        # Single query: all explicit grants for this user
        grants_q = select(Permission).where(Permission.grantee_id == user_uuid)
        result = await db.execute(grants_q)
        all_grants = result.scalars().all()

        granted_library_ids: set[uuid.UUID] = {g.library_id for g in all_grants if g.library_id}
        granted_collection_ids: set[uuid.UUID] = {g.collection_id for g in all_grants if g.collection_id}
        granted_movie_ids: set[uuid.UUID] = {g.movie_id for g in all_grants if g.movie_id}

        visible: list[Movie] = []
        for movie in movies:
            col = movie.collection
            lib = col.library if col else None

            if col is None or lib is None:
                continue

            # Library owner sees all
            if str(lib.owner_id) == user_id:
                visible.append(movie)
                continue

            # Explicit movie-level grant
            if movie.id in granted_movie_ids:
                visible.append(movie)
                continue

            # Private library gating
            if lib.is_private and lib.id not in granted_library_ids:
                continue

            # Effective visibility
            effective = movie.visibility_override or col.visibility

            if effective == Visibility.SHARED:
                visible.append(movie)
            elif effective == Visibility.FRIENDS:
                if col.id in granted_collection_ids:
                    visible.append(movie)
            # PRIVATE: only explicit grants (already handled above)

        return visible

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
