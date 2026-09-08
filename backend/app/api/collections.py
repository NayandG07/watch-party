import uuid

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.dependencies import CurrentUserRoleDep, DatabaseDep, RequireLevel2Dep
from app.models.collection import Collection
from app.models.enums import Visibility
from app.models.library import Library
from app.models.permission import Permission
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
    await db.flush()

    if payload.visibility == Visibility.FRIENDS and payload.selected_user_ids:
        for grantee_id in payload.selected_user_ids:
            perm = Permission(
                grantee_id=grantee_id,
                granted_by_id=uuid.UUID(user_id),
                collection_id=new_collection.id,
            )
            db.add(perm)

    await db.commit()

    # Reload with relations to satisfy CollectionResponse
    stmt = (
        select(Collection)
        .where(Collection.id == new_collection.id)
        .options(selectinload(Collection.library).selectinload(Library.owner))
    )
    result = await db.execute(stmt)
    created = result.scalar_one()

    # Populate granted_user_ids
    perm_stmt = select(Permission.grantee_id).where(Permission.collection_id == created.id)
    perm_res = await db.execute(perm_stmt)
    created.granted_user_ids = list(perm_res.scalars().all())

    return created


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

    if not await PermissionService.can_view_collection(
        collection, collection.library, user_id, user_role, db
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    perm_stmt = select(Permission.grantee_id).where(Permission.collection_id == collection.id)
    perm_res = await db.execute(perm_stmt)
    collection.granted_user_ids = list(perm_res.scalars().all())

    return collection


@router.get("/{collection_id}/permissions", response_model=list[uuid.UUID])
async def get_collection_permissions(
    collection_id: uuid.UUID,
    user_role_pair: CurrentUserRoleDep,
    db: DatabaseDep,
) -> list[uuid.UUID]:
    """Get list of user IDs explicitly granted access to this collection."""
    user_id, user_role = user_role_pair
    stmt = (
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.library))
    )
    result = await db.execute(stmt)
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if not await PermissionService.can_manage_collection(
        collection, collection.library, user_id, user_role
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    perm_stmt = select(Permission.grantee_id).where(Permission.collection_id == collection_id)
    perm_res = await db.execute(perm_stmt)
    return list(perm_res.scalars().all())


@router.patch("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: uuid.UUID,
    payload: CollectionUpdate,
    user_info: RequireLevel2Dep,
    db: DatabaseDep,
) -> Collection:
    user_id, user_role = user_info

    stmt = (
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.library).selectinload(Library.owner))
    )
    result = await db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if not await PermissionService.can_manage_collection(
        collection, collection.library, user_id, user_role
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = payload.model_dump(exclude_unset=True, exclude={"selected_user_ids"})
    for key, value in update_data.items():
        setattr(collection, key, value)

    # Sync selected users permissions
    if payload.selected_user_ids is not None:
        await db.execute(
            delete(Permission).where(Permission.collection_id == collection.id)
        )
        target_vis = payload.visibility or collection.visibility
        if target_vis == Visibility.FRIENDS:
            for grantee_id in payload.selected_user_ids:
                perm = Permission(
                    grantee_id=grantee_id,
                    granted_by_id=uuid.UUID(user_id),
                    collection_id=collection.id,
                )
                db.add(perm)

    await db.commit()
    await db.refresh(collection)

    perm_stmt = select(Permission.grantee_id).where(Permission.collection_id == collection.id)
    perm_res = await db.execute(perm_stmt)
    collection.granted_user_ids = list(perm_res.scalars().all())

    return collection


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: uuid.UUID,
    user_info: RequireLevel2Dep,
    db: DatabaseDep,
) -> None:
    user_id, user_role = user_info

    stmt = (
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.library).selectinload(Library.owner))
    )
    result = await db.execute(stmt)
    collection = result.scalar_one_or_none()

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if not await PermissionService.can_manage_collection(
        collection, collection.library, user_id, user_role
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(collection)
    await db.commit()
