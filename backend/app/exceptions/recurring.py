from app.exceptions.base import AppException


# recurring expense doesn't exists
class RecurringExpenseDoesNotExist(AppException):
    status_code = 404
    default_detail = "Recurring Expense not found"
