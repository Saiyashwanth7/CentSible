from app.exceptions.base import AppException


# inavlid imported file
class InvalidImportedFile(AppException):
    status_code = 422
    default_detail = "Couldn't read this file."


# imported file too large
class ImportedFileTooLarge(AppException):
    status_code = 413
    default_detail = "File is larger than 2MB."


# not a csv / pdf / image
class UnsupportedImportFile(AppException):
    status_code = 415
    default_detail = "Upload a CSV, a PDF, or a JPG, PNG or WebP photo of a receipt."


# too many files in one request
class TooManyImportFiles(AppException):
    status_code = 422
    default_detail = "Upload at most 10 files at a time."


# the AI provider failed or is rate limited
class ImportAIUnavailable(AppException):
    status_code = 503
    default_detail = "Receipt reading is unavailable right now. Try again in a minute."


# user is importing too often (each receipt costs an AI call)
class ImportRateLimited(AppException):
    status_code = 429
    default_detail = "Too many imports. Try again in a while."
