from pydantic import Field, PlainSerializer, StringConstraints
from decimal import Decimal
from typing import Annotated

# MONEY_IN
MoneyIn = Annotated[
    Decimal, Field(gt=0, le=Decimal("10000000"), max_digits=10, decimal_places=2)
]

# MONEY OUT

MoneyOut = Annotated[
    Decimal, PlainSerializer(float, return_type=float, when_used="json")
]


# SHORT TEXT
ShortText = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=400)
]
