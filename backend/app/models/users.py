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


class User(Base):
    __tablename__ = "user_table"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)
    name = Column(String, nullable=False)
    google_id = Column(String(200), unique=True, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    password_updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    expenses = relationship(
        "Expense", back_populates="owner", cascade="all, delete", passive_deletes=True
    )

    budgets = relationship(
        "Budget", back_populates="owner", cascade="all, delete", passive_deletes=True
    )

    recurring = relationship(
        "RecurringExpense",
        back_populates="owner",
        cascade="all, delete",
        passive_deletes=True,
    )

    categories = relationship(
        "Category", back_populates="owner", cascade="all, delete", passive_deletes=True
    )
