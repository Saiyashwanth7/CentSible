from typing import Any, Iterable


def apply_updates(
    obj: Any, updates: dict[str, Any], blank_on_none: Iterable[str] = ()
) -> None:
    """Copy fields from a partial-update dict onto a model.

    `None` for a required field is ignored. For fields in `blank_on_none`
    (e.g. notes) `None` clears the value to an empty string.
    """
    for field, value in updates.items():
        if value is None:
            if field not in blank_on_none:
                continue
            value = ""
        setattr(obj, field, value)  # => set attribute obj.field = value
