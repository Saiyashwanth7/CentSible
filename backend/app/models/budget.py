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


class Budget(Base):
    __tablename__ = "budget_table"

    id = Column(Integer, primary_key=True, index=True)

    owner_id = Column(
        Integer,
        ForeignKey("user_table.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    monthly_limit = Column(
        Numeric(10, 2),
        nullable=False,
    )

    owner = relationship(
        "User",
        back_populates="budgets",
    )

    category = relationship(
        "Category",
        back_populates="budgets",
    )

    __table_args__ = (
        UniqueConstraint(
            "owner_id",
            "category_id",
            name="uq_budget_owner_category",
        ),
    )
