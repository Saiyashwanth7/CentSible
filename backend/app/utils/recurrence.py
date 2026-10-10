import calendar
from datetime import date, timedelta

from app.enums.frequency import Frequency


# we use this advance function to find the next date of subscription fee
def advance(current: date, frequency: str | Frequency, anchor_day: int) -> date:
    """Next occurrence after `current`.

    `anchor_day` is the original day of month, so Jan 31 -> Feb 28 -> Mar 31
    instead of getting stuck on the 28th.
    """
    frequency = Frequency(frequency)
    if frequency == Frequency.DAILY:
        return current + timedelta(days=1)
    if frequency == Frequency.WEEKLY:
        return current + timedelta(days=7)
    if frequency == Frequency.MONTHLY:
        year, month = (
            (current.year + 1, 1)
            if current.month == 12
            else (current.year, current.month + 1)
        )
    else:  # yearly
        year, month = current.year + 1, current.month
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(anchor_day, last_day))
