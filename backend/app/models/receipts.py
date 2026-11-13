from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.enums.receipt import Status


class Receipt(Base):
    __tablename__ = "receipts_table"

    id = Column(Integer, index=True, primary_key=True)

    owner_id = Column(
        Integer,
        ForeignKey("user_table.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    file_key = Column(String, nullable=False)
    status = Column(String, nullable=False, default=Status.PENDING.value)
    extracted_data = Column(JSONB, nullable=True)
    error_message = Column(String, nullable=True)

    expense_id = Column(
        Integer,
        ForeignKey("expense_table.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    owner = relationship("User", back_populates="receipts")
