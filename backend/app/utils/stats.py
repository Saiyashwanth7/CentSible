"""Pure date/number helpers. No database code here (that lives in the services)."""

from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

# TODO: move to settings. On Windows run `pip install tzdata` for zoneinfo to work.
APP_TIMEZONE = ZoneInfo("Asia/Kolkata")


def today_local() -> date:
    """Today's date in the app's timezone (a UTC server would be off by up to 5.5h)."""
    return datetime.now(APP_TIMEZONE).date()


def shift_month(d: date, months: int) -> date:
    """First day of the month that is `months` away from `d`'s month."""
    index = d.year * 12 + (d.month - 1) + months
    return date(index // 12, index % 12 + 1, 1)


def pct_change(current: Decimal, previous: Decimal) -> float | None:
    if previous == 0:
        return None
    return round(float((current - previous) / previous * 100), 1)
