from app.exceptions.base import AppException


# inavlid imported file
class InvalidImportedFile(AppException):
    status_code = 422
    default_detail = "Couldn't read this file."


# imported file too large
class ImportedFileTooLarge(AppException):
    status_code = 413
    default_detail = "File is larger than 2MB."
