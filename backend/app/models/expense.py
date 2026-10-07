from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Numeric,
)
from decimal import Decimal
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone

from app.db.base_class import Base


class Expense(Base):
    __tablename__ = "expense_table"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(300), nullable=False)

    amount = Column(
        Numeric(10, 2),
        nullable=False,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False,
        index=True,
    )

    date = Column(
        Date,
        nullable=False,
        index=True,
    )

    notes = Column(
        String,
        default="",
        nullable=True,
    )

    owner_id = Column(
        Integer,
        ForeignKey("user_table.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    receipt_key = Column(String(500), nullable=True)

    owner = relationship(
        "User",
        back_populates="expenses",
    )

    category = relationship(
        "Category",
        back_populates="expenses",
    )
