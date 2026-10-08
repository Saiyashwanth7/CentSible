class AppException:
    status_code: int = 400
    default_detail: str = "Something went wrong"

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.default_detail
        super().__init__(self.detail)
