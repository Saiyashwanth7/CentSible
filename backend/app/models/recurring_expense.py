from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
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


class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True)

    owner_id = Column(
        Integer,
        ForeignKey("user_table.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(
        String,
        nullable=False,
    )

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

    notes = Column(
        String,
        default="",
    )

    frequency = Column(
        String,
        nullable=False,
    )

    anchor_day = Column(
        Integer,
        nullable=False,
    )

    next_date = Column(
        Date,
        nullable=False,
    )

    active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    owner = relationship(
        "User",
        back_populates="recurring",
    )

    category = relationship(
        "Category",
        back_populates="recurring_expenses",
    )
