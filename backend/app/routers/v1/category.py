from fastapi import APIRouter, status
from app.routers.dependencies import CurrentUser, SessionDep
from app.models import Category
from app.services import category_services

from app.schema.category import (
    CategoryCreate,
    CategoryReassignRequest,
    CategoryReassignResponse,
    CategoryResponse,
    CategoryUpdate,
)

router = APIRouter()


# get_category
@router.get("", response_model=list[CategoryResponse])
async def get_category(user: CurrentUser, session: SessionDep):
    return await category_services.list_categories(user.id, session)


# create_category
@router.post("/", response_model=CategoryResponse)
async def create_category(user: CurrentUser, data: CategoryCreate, session: SessionDep):
    return await category_services.create_category(user.id, data, session)


# rename_category
@router.patch("/{category_id}", response_model=CategoryResponse)
async def rename_category(
    category_id: int, user: CurrentUser, data: CategoryUpdate, session: SessionDep
):
    return await category_services.rename_category(category_id, user.id, session, data)


# delete_category
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, user: CurrentUser, session: SessionDep):
    return await category_services.delete_category(category_id, user.id, session)


# reassign_category
@router.post("/{category_id}/reassign", response_model=CategoryReassignResponse)
async def reassign_category(
    category_id: int,
    user: CurrentUser,
    data: CategoryReassignRequest,
    session: SessionDep,
):
    moved = await category_services.reassign_category(
        category_id, data.to_category_ind, user.id, session
    )
    return CategoryReassignResponse(moved=moved)
