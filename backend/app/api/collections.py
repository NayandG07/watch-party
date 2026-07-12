import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserIdDep, DatabaseDep, RequireAdminDep
from app.models.collection import Collection
from app.schemas.library import CollectionCreate, CollectionResponse, CollectionUpdate

router = APIRouter(prefix="/collections", tags=["collections"])


@router.get("", response_model=list[CollectionResponse])
async def list_collections(
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
    library_id: uuid.UUID | None = Query(None, description="Filter by library ID"),
) -> list[Collection]:
    stmt = select(Collection).order_by(Collection.sort_order.asc(), Collection.created_at.desc())
    if library_id:
        stmt = stmt.where(Collection.library_id == library_id)
        
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    payload: CollectionCreate,
    _: RequireAdminDep,
    db: DatabaseDep,
) -> Collection:
    new_collection = Collection(
        library_id=payload.library_id,
        name=payload.name,
        description=payload.description,
        visibility=payload.visibility,
        sort_order=payload.sort_order,
    )
    db.add(new_collection)
    await db.commit()
    await db.refresh(new_collection)
    return new_collection


@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: uuid.UUID,
    current_user_id: CurrentUserIdDep,
    db: DatabaseDep,
) -> Collection:
    collection = await db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return collection


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: uuid.UUID,
    payload: CollectionUpdate,
    _: RequireAdminDep,
    db: DatabaseDep,
) -> Collection:
    collection = await db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(collection, key, value)

    await db.commit()
    await db.refresh(collection)
    return collection


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: uuid.UUID,
    _: RequireAdminDep,
    db: DatabaseDep,
) -> None:
    collection = await db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    await db.delete(collection)
    await db.commit()
