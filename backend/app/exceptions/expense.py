from app.exceptions.base import AppException


# expense deosn't exists
class ExpenseDoesntExists(AppException):
    status_code = 404
    default_detail = "Expense not found"
