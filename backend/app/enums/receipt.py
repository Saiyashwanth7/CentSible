from enum import Enum


class Status(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"
    CONFIRMED = "confirmed"
