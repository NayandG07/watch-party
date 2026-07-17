import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserRoleDep, DatabaseDep, RequireAdminDep, RequireLevel2Dep
from app.models.collection import Collection
from app.models.library import Library
from app.models.movie import Movie
from app.models.user import User
from app.schemas.library import CollectionWithMoviesBrief, LibraryCreate, LibraryResponse, LibraryUpdate
from app.schemas.movie import MovieBrief
from app.services.permission import PermissionService

router = APIRouter(prefix="/libraries", tags=["libraries"])


@router.get("", response_model=list[LibraryResponse])
async def list_libraries(
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
) -> list[Library]:
    user_id, user_role = user_role_pair
    stmt = (
        select(Library)
        .options(selectinload(Library.owner), selectinload(Library.storage_provider))
        .order_by(Library.created_at.desc())
    )
    result = await db.execute(stmt)
    all_libraries = list(result.scalars().all())

    # Filter by permission
    visible = []
    for lib in all_libraries:
        if await PermissionService.can_view_library(lib, user_id, user_role, db):
            visible.append(lib)
    return visible


@router.post("", response_model=LibraryResponse, status_code=status.HTTP_201_CREATED)
async def create_library(
    payload: LibraryCreate,
    user_info: RequireLevel2Dep,
    db: DatabaseDep,
) -> Library:
    user_id, _ = user_info

    new_library = Library(
        name=payload.name,
        description=payload.description,
        storage_provider_id=payload.storage_provider_id,
        is_private=payload.is_private,
        owner_id=uuid.UUID(user_id),
    )
    db.add(new_library)
    await db.commit()
    
    # Reload with relations
    stmt = (
        select(Library)
        .where(Library.id == new_library.id)
        .options(selectinload(Library.owner), selectinload(Library.storage_provider))
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/library-summary", response_model=list[CollectionWithMoviesBrief], tags=["library"])
async def get_library_summary(
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
) -> list[dict]:
    """Return all visible collections with their movies in two queries.

    Replaces the frontend N+1 waterfall (fetch collections, then per-collection
    movie fetch) with a single endpoint that eager-loads everything at once.
    Permission filtering is done via the batch methods — still just 1 extra
    DB round-trip for the grants table regardless of how many collections exist.
    """
    user_id, user_role = user_role_pair

    # Query 1: All collections + their parent library + library owner (for permission checks + response)
    col_stmt = (
        select(Collection)
        .options(
            selectinload(Collection.library).selectinload(Library.owner),
        )
        .order_by(Collection.sort_order.asc(), Collection.created_at.desc())
    )
    col_result = await db.execute(col_stmt)
    all_collections = list(col_result.scalars().all())

    # Batch-filter collections the user can see (1 grant query max)
    visible_collections = await PermissionService.batch_filter_visible_collections(
        collections=all_collections,
        user_id=user_id,
        user_role=user_role,
        db=db,
    )

    if not visible_collections:
        return []

    # Query 2: All movies for the visible collections in one query
    visible_col_ids = [c.id for c in visible_collections]
    movie_stmt = (
        select(Movie)
        .where(Movie.collection_id.in_(visible_col_ids))
        .options(selectinload(Movie.collection).selectinload(Collection.library))
        .order_by(Movie.title)
    )
    movie_result = await db.execute(movie_stmt)
    all_movies = list(movie_result.scalars().all())

    # Batch-filter movies (reuses same grant set — no extra DB hit for super_admin/owner)
    visible_movies = await PermissionService.batch_filter_visible_movies(
        movies=all_movies,
        user_id=user_id,
        user_role=user_role,
        db=db,
    )

    # Group movies by collection_id
    movies_by_col: dict[uuid.UUID, list[Movie]] = {}
    for col in visible_collections:
        movies_by_col[col.id] = []
    for movie in visible_movies:
        if movie.collection_id in movies_by_col:
            movies_by_col[movie.collection_id].append(movie)

    # Build response — manually construct dicts to avoid Pydantic circular import
    result = []
    for col in visible_collections:
        col_movies = movies_by_col.get(col.id, [])
        lib = col.library
        result.append({
            "id": col.id,
            "library_id": col.library_id,
            "name": col.name,
            "description": col.description,
            "visibility": col.visibility,
            "poster_path": col.poster_path,
            "sort_order": col.sort_order,
            "movie_count": len(col_movies),
            "library": {
                "id": lib.id,
                "name": lib.name,
                "is_private": lib.is_private,
                "owner": {
                    "id": lib.owner_id,
                    "username": lib.owner.username if lib.owner else "",
                    "role": lib.owner.role.value if lib.owner else "level1",
                },
            },
            "movies": [
                {
                    "id": m.id,
                    "title": m.title,
                    "slug": m.slug,
                    "year": m.year,
                    "duration_seconds": m.duration_seconds,
                    "resolution": m.resolution,
                    "is_processed": m.is_processed,
                    "is_uploaded": m.is_uploaded,
                    "thumbnail_url": None,  # CDN URL built client-side
                    "poster_url": None,
                }
                for m in col_movies
            ],
        })

    return result


@router.get("/{library_id}", response_model=LibraryResponse)
async def get_library(
    library_id: uuid.UUID,
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
) -> Library:
    user_id, user_role = user_role_pair
    stmt = (
        select(Library)
        .where(Library.id == library_id)
        .options(selectinload(Library.owner), selectinload(Library.storage_provider))
    )
    result = await db.execute(stmt)
    library = result.scalar_one_or_none()
    
    if not library:
        raise HTTPException(status_code=404, detail="Library not found")

    if not await PermissionService.can_view_library(library, user_id, user_role, db):
        raise HTTPException(status_code=403, detail="Access denied")
        
    return library


@router.patch("/{library_id}", response_model=LibraryResponse)
async def update_library(
    library_id: uuid.UUID,
    payload: LibraryUpdate,
    user_info: RequireLevel2Dep,
    db: DatabaseDep,
) -> Library:
    user_id, user_role = user_info
    stmt = (
        select(Library)
        .where(Library.id == library_id)
        .options(selectinload(Library.owner), selectinload(Library.storage_provider))
    )
    result = await db.execute(stmt)
    library = result.scalar_one_or_none()
    
    if not library:
        raise HTTPException(status_code=404, detail="Library not found")

    if not await PermissionService.can_manage_library(library, user_id, user_role):
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(library, key, value)

    await db.commit()
    await db.refresh(library)
    return library


@router.delete("/{library_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_library(
    library_id: uuid.UUID,
    user_info: RequireLevel2Dep,
    db: DatabaseDep,
) -> None:
    user_id, user_role = user_info
    library = await db.get(Library, library_id)
    if not library:
        raise HTTPException(status_code=404, detail="Library not found")
        
    if not await PermissionService.can_manage_library(library, user_id, user_role):
        raise HTTPException(status_code=403, detail="Access denied")
        
    await db.delete(library)
    await db.commit()
