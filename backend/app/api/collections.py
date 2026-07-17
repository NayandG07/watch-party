import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserRoleDep, DatabaseDep, RequireAdminDep, RequireLevel2Dep
from app.models.collection import Collection
from app.models.library import Library
from app.schemas.library import CollectionCreate, CollectionResponse, CollectionUpdate
from app.services.permission import PermissionService

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("", response_model=list[CollectionResponse])
async def list_collections(
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
    library_id: uuid.UUID | None = Query(None, description="Filter by library ID"),
) -> list[Collection]:
    user_id, user_role = user_role_pair
    stmt = (
        select(Collection)
        .options(selectinload(Collection.library).selectinload(Library.owner))
        .order_by(Collection.sort_order.asc(), Collection.created_at.desc())
    )
    if library_id:
        stmt = stmt.where(Collection.library_id == library_id)
        
    result = await db.execute(stmt)
    all_collections = list(result.scalars().all())

    return await PermissionService.batch_filter_visible_collections(
        collections=all_collections,
        user_id=user_id,
        user_role=user_role,
        db=db,
    )


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    payload: CollectionCreate,
    user_info: RequireLevel2Dep,
    db: DatabaseDep,
) -> Collection:
    user_id, user_role = user_info
    library = await db.get(Library, payload.library_id)
    if not library:
        raise HTTPException(status_code=404, detail="Library not found")
        
    if not await PermissionService.can_manage_library(library, user_id, user_role):
        raise HTTPException(status_code=403, detail="Access denied to this library")
    new_collection = Collection(
        library_id=payload.library_id,
        name=payload.name,
        description=payload.description,
        visibility=payload.visibility,
        sort_order=payload.sort_order,
    )
    db.add(new_collection)
    await db.commit()
    
    # Reload with relations to satisfy CollectionResponse
    stmt = (
        select(Collection)
        .where(Collection.id == new_collection.id)
        .options(selectinload(Collection.library).selectinload(Library.owner))
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: uuid.UUID,
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
) -> Collection:
    user_id, user_role = user_role_pair
    stmt = (
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.library).selectinload(Library.owner))
    )
    result = await db.execute(stmt)
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if not await PermissionService.can_view_collection(collection, collection.library, user_id, user_role, db):
        raise HTTPException(status_code=403, detail="Access denied")

    return collection


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: uuid.UUID,
    payload: CollectionUpdate,
    user_info: RequireLevel2Dep,
    db: DatabaseDep,
) -> Collection:
    user_id, user_role = user_info
    
    stmt = select(Collection).where(Collection.id == collection_id).options(selectinload(Collection.library).selectinload(Library.owner))
    result = await db.execute(stmt)
    collection = result.scalar_one_or_none()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if not await PermissionService.can_manage_collection(collection, collection.library, user_id, user_role):
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(collection, key, value)

    await db.commit()
    await db.refresh(collection)
    return collection


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: uuid.UUID,
    user_info: RequireLevel2Dep,
    db: DatabaseDep,
) -> None:
    user_id, user_role = user_info
    
    stmt = select(Collection).where(Collection.id == collection_id).options(selectinload(Collection.library).selectinload(Library.owner))
    result = await db.execute(stmt)
    collection = result.scalar_one_or_none()
    
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    if not await PermissionService.can_manage_collection(collection, collection.library, user_id, user_role):
        raise HTTPException(status_code=403, detail="Access denied")
        
    await db.delete(collection)
    await db.commit()
