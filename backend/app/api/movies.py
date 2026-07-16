import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import Settings, get_settings
from app.core.dependencies import CurrentUserRoleDep, DatabaseDep, RequireAdminDep, RequireLevel2Dep
from app.core.security import create_hls_key_token
from app.models.collection import Collection
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
    new_movie = Movie(
        collection_id=payload.collection_id,
        title=payload.title,
        description=payload.description,
        year=payload.year,
        visibility_override=payload.visibility_override,
        external_ids=payload.external_ids,
    )
    db.add(new_movie)
    await db.commit()
    
    # Reload with collection relation
    stmt = (
        select(Movie)
        .where(Movie.id == new_movie.id)
        .options(selectinload(Movie.collection).selectinload("library"))
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
        .options(selectinload(Movie.collection).selectinload(Collection.library))
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
    await db.refresh(movie)
    return movie


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
        .options(selectinload(Movie.collection).selectinload("library"))
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
    from app.core.security import encrypt_storage_secret

    # Encrypt the HLS AES-128 key
    key_hex = update_data.pop("hls_key_hex")
    iv_hex = update_data.pop("hls_iv_hex")
    
    enc_key = encrypt_storage_secret(key_hex)
    enc_iv = encrypt_storage_secret(iv_hex)

    new_hls_key = HLSKey(
        movie_id=movie.id,
        key_hex_encrypted=enc_key,
        iv_hex_encrypted=enc_iv
    )
    db.add(new_hls_key)

    for key, value in update_data.items():
        if hasattr(movie, key):
            setattr(movie, key, value)

    await db.commit()
    await db.refresh(movie)
    return movie


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
        .options(selectinload(Movie.collection).selectinload(Collection.library))
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

    # In a real scenario, this domain points to the Cloudflare CDN serving the B2 bucket.
    hls_url = f"{settings.frontend_url}/cdn/{movie.hls_master_path}"

    return PlaybackTokenResponse(
        hls_url=hls_url,
        hls_key_token=token,
        expires_at=expires_at,
    )
