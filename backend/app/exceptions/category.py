from app.exceptions.base import AppException


# doesn't exists
class CategoryDoesNotExist(AppException):
    status_code = 404
    default_detail = "Category not found"


# already exists
class CategoryAlreadyExists(AppException):
    status_code = 409
    default_detail = "You already have a category with that name."


# in use
class CategoryInUse(AppException):
    status_code = 409
    default_detail = (
        "This category still has expenses. Move them to another category first."
    )


# protected
class CategoryProtected(AppException):
    status_code = 409
    default_detail = "The 'Other' category can't be renamed or deleted."
