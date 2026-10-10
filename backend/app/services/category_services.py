from sqlalchemy import exists, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.category import (
    CategoryAlreadyExists,
    CategoryDoesNotExist,
    CategoryInUse,
    CategoryProtected,
)
from app.models.category import Category
from app.models.expense import Expense
from app.models.recurring_expense import RecurringExpense
from app.schema.category import CategoryCreate, CategoryUpdate
from app.utils.categorization import DEFAULT_CATEGORIES, FALLBACK_CATEGORY


# _is_protected
def _is_protected(name: str) -> bool:
    return name.strip().lower() == FALLBACK_CATEGORY


# seed default categories
# seed the default categories into newly created user
async def seed_default_categories(
    user_id: int, session: AsyncSession
) -> list[Category]:
    categories = [Category(name=name, owner_id=user_id) for name in DEFAULT_CATEGORIES]
    session.add_all(categories)
    await session.flush()
    return categories


# list categories
async def list_categories(user_id: int, session: AsyncSession) -> list[Category]:
    result = await session.scalars(
        select(Category).where(Category.owner_id == user_id).order_by(Category.name)
    )
    return list(result.all())


# get category by id
# check if the category belongs to the actual user
""" THIS FUNCTION WILL HELP US TO BOTH GET THE CATEGORY RECORD AND ACTS AS A CHECK FOR RELATION BETWEEN CATEGORY AND USER"""


async def get_category(
    category_id: int, user_id: int, session: AsyncSession
) -> Category:
    result = await session.scalar(
        select(Category).where(Category.id == category_id, Category.owner_id == user_id)
    )
    if result is None:
        raise CategoryDoesNotExist
    return result


# get category by name
async def get_category_by_name(
    name: str, user_id: int, session: AsyncSession
) -> Category:
    result = await session.scalar(
        select(Category).where(
            func.lower(Category.name) == name.strip().lower(),
            Category.owner_id == user_id,
        )
    )
    if result is None:
        raise CategoryDoesNotExist
    return result


# create category
async def create_category(
    user_id: int, data: CategoryCreate, session: AsyncSession
) -> Category:
    if get_category_by_name(data.name, user_id, session):
        raise CategoryAlreadyExists
    category = Category(owner_id=user_id, name=data.name)
    session.add(category)
    await session.flush()
    return category


# rename catgeory
async def rename_category(
    category_id: int, user_id: int, session: AsyncSession, data: CategoryUpdate
) -> Category:
    category = await get_category(category_id, user_id, session)
    if _is_protected(category.name):
        raise CategoryProtected
    clash = await get_category_by_name(data.name, user_id, session)
    if clash and clash.id != category.id:
        raise CategoryAlreadyExists
    category.name = data.name
    session.add(category)
    await session.flush()
    return category


# delete category
async def delete_category(
    category_id: int, user_id: int, session: AsyncSession
) -> None:
    # get category
    category = await get_category(category_id, user_id, session)
    # check if category.name=="others"
    if _is_protected(category.name):
        raise CategoryProtected
    # check if category is being used by any record in Expense
    used_by_expense = await session.scalar(
        select(exists().where(Expense.category_id == category.id))
    )
    # check if the category is being used by any record in RecurringExpense
    used_by_recurring = await session.scalar(
        select(exists().where(RecurringExpense.category_id == category.id))
    )
    # a deleting category must not be used by any records, must be moved from on category to other
    if used_by_expense or used_by_recurring:
        raise CategoryInUse

    await session.delete(category)
    await session.flush()


# reassign category
async def reassign_category(
    from_id: int, to_id: int, user_id: int, session: AsyncSession
) -> int:
    await get_category(from_id, user_id, session)
    await get_category(to_id, user_id, session)
    if from_id == to_id:
        return 0
    moved = 0
    for model in (Expense, RecurringExpense):
        result = await session.execute(
            update(model)
            .where(model.category_id == from_id, model.owner_id == user_id)
            .values(category_id=to_id)
            .execution_options(synchronize_session=False)
        )
        moved += result.rowcount
    return moved
