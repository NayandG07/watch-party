import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserIdDep, CurrentUserRoleDep, DatabaseDep, RequireAdminDep
from app.models.library import Library
from app.models.user import User
from app.schemas.library import LibraryCreate, LibraryResponse, LibraryUpdate
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
    admin_info: RequireAdminDep,
    db: DatabaseDep,
) -> Library:
    admin_id, _ = admin_info

    new_library = Library(
        name=payload.name,
        description=payload.description,
        storage_provider_id=payload.storage_provider_id,
        is_private=payload.is_private,
        owner_id=uuid.UUID(admin_id),
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
    _: RequireAdminDep,
    db: DatabaseDep,
) -> Library:
    stmt = (
        select(Library)
        .where(Library.id == library_id)
        .options(selectinload(Library.owner), selectinload(Library.storage_provider))
    )
    result = await db.execute(stmt)
    library = result.scalar_one_or_none()
    
    if not library:
        raise HTTPException(status_code=404, detail="Library not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(library, key, value)

    await db.commit()
    await db.refresh(library)
    return library


@router.delete("/{library_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_library(
    library_id: uuid.UUID,
    _: RequireAdminDep,
    db: DatabaseDep,
) -> None:
    library = await db.get(Library, library_id)
    if not library:
        raise HTTPException(status_code=404, detail="Library not found")
        
    await db.delete(library)
    await db.commit()
