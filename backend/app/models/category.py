from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Numeric,
)
from decimal import Decimal
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timezone

from app.db.base_class import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    owner_id = Column(
        Integer,
        ForeignKey("user_table.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    owner = relationship(
        "User",
        back_populates="categories",
    )

    expenses = relationship("Expense", back_populates="category", passive_deletes=True)

    budgets = relationship("Budget", back_populates="category", passive_deletes=True)

    recurring_expenses = relationship(
        "RecurringExpense", back_populates="category", passive_deletes=True
    )

    __table_args__ = (
        UniqueConstraint(
            "owner_id",
            "name",
            name="uq_category_owner_name",
        ),
    )
