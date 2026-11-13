from app.exceptions.base import AppException


class ReceiptDoesNotExist(AppException):
    status_code = 404
    default_detail = "Receipt not found"


class InvalidReceiptFile(AppException):
    status_code = 400
    default_detail = "Only JPEG, PNG or WebP images allowed"


class ReceiptTooLarge(AppException):
    status_code = 413
    default_detail = "File too large (max 5 MB)"


class ReceiptAlreadyConfirmed(AppException):
    status_code = 409
    default_detail = "Receipt already confirmed"


class GuestUploadNotAllowed(AppException):
    status_code = 403
    default_detail = "Guests can't upload receipts. Please sign up"
