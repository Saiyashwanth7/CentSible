from app.exceptions.base import AppException


class BudgetDoesNotExist(AppException):
    status_code = 404
    default_detail = "Budget not found"
