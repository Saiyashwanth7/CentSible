from pydantic import BaseModel, StringConstraints
from typing import Annotated

"""
    RESPONSE basemodels are used by the APIs, remaining are used in the business logic
"""

# category name
CategoryName = Annotated[
    str, StringConstraints(min_length=1, max_length=100, strip_whitespace=True)
]


# category create
class CategoryCreate(BaseModel):
    name = CategoryName


# category update
class CategoryUpdate(BaseModel):
    name = CategoryName


# category response
class CategoryResponse(BaseModel):
    id: int
    name: str  # here name is not categoryName bacause this pydantic model will to get reponse from DB, not from the user, so no contraints needed


# category reassign request
class CategoryReassignRequest(BaseModel):
    to_category_ind: int


# category reassign response
class CategoryReassignResponse(BaseModel):
    moved: int
