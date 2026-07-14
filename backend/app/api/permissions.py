"""
Permissions API — explicit access grant management.

POST   /api/permissions        — Grant access to a resource
GET    /api/permissions        — List grants made by the current user
DELETE /api/permissions/{id}   — Revoke a grant

Only the resource owner or super_admin can create/delete grants.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status, Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserRoleDep, DatabaseDep
from app.models.collection import Collection
from app.models.library import Library
from app.models.movie import Movie
from app.models.permission import Permission
from app.schemas.permission import PermissionCreate, PermissionResponse

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.post("", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def grant_permission(
    payload: PermissionCreate,
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
) -> Permission:
    user_id, user_role = user_role_pair

    # Verify the granter actually owns the target resource
    await _assert_owner_or_admin(
        user_id=user_id,
        user_role=user_role,
        db=db,
        library_id=payload.library_id,
        collection_id=payload.collection_id,
        movie_id=payload.movie_id,
    )

    # Guard against duplicate grants
    existing = await _find_existing_grant(
        grantee_id=payload.grantee_id,
        db=db,
        library_id=payload.library_id,
        collection_id=payload.collection_id,
        movie_id=payload.movie_id,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission grant already exists",
        )

    perm = Permission(
        grantee_id=payload.grantee_id,
        granted_by_id=uuid.UUID(user_id),
        library_id=payload.library_id,
        collection_id=payload.collection_id,
        movie_id=payload.movie_id,
    )
    db.add(perm)
    await db.commit()

    stmt = (
        select(Permission)
        .where(Permission.id == perm.id)
        .options(
            selectinload(Permission.grantee),
            selectinload(Permission.granter),
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("", response_model=list[PermissionResponse])
async def list_my_granted_permissions(
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
) -> list[Permission]:
    """Returns all grants *issued* by the current user (i.e. grants they control)."""
    user_id, _ = user_role_pair

    stmt = (
        select(Permission)
        .where(Permission.granted_by_id == uuid.UUID(user_id))
        .options(
            selectinload(Permission.grantee),
            selectinload(Permission.granter),
        )
        .order_by(Permission.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def revoke_permission(
    permission_id: uuid.UUID,
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
):
    perm = await db.get(Permission, permission_id)
    if not perm:
        raise HTTPException(status_code=404, detail="Permission not found")

    user_id, user_role = user_role_pair

    # Only the granter or an admin can revoke
    if user_role != "super_admin" and str(perm.granted_by_id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only revoke grants you created",
        )

    await db.delete(perm)
    await db.commit()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _assert_owner_or_admin(
    user_id: str,
    user_role: str,
    db: DatabaseDep,
    library_id: uuid.UUID | None,
    collection_id: uuid.UUID | None,
    movie_id: uuid.UUID | None,
) -> None:
    """Raise 403 if the user doesn't own the target resource."""
    if user_role == "super_admin":
        return

    if library_id:
        lib = await db.get(Library, library_id)
        if not lib or str(lib.owner_id) != user_id:
            raise HTTPException(status_code=403, detail="You don't own this library")

    elif collection_id:
        stmt = (
            select(Collection)
            .where(Collection.id == collection_id)
            .options(selectinload(Collection.library))
        )
        result = await db.execute(stmt)
        col = result.scalar_one_or_none()
        if not col or str(col.library.owner_id) != user_id:
            raise HTTPException(status_code=403, detail="You don't own this collection")

    elif movie_id:
        stmt = (
            select(Movie)
            .where(Movie.id == movie_id)
            .options(selectinload(Movie.collection).selectinload(Collection.library))
        )
        result = await db.execute(stmt)
        movie = result.scalar_one_or_none()
        if not movie or str(movie.collection.library.owner_id) != user_id:
            raise HTTPException(status_code=403, detail="You don't own this movie")


async def _find_existing_grant(
    grantee_id: uuid.UUID,
    db: DatabaseDep,
    library_id: uuid.UUID | None,
    collection_id: uuid.UUID | None,
    movie_id: uuid.UUID | None,
) -> Permission | None:
    stmt = select(Permission).where(Permission.grantee_id == grantee_id)
    if library_id:
        stmt = stmt.where(Permission.library_id == library_id)
    elif collection_id:
        stmt = stmt.where(Permission.collection_id == collection_id)
    elif movie_id:
        stmt = stmt.where(Permission.movie_id == movie_id)
    result = await db.execute(stmt.limit(1))
    return result.scalar_one_or_none()
