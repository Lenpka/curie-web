class InvalidFormulaError(ValueError):
    def __init__(
        self,
        formula: str,
        message: str = "Invalid formula",
        suggestion: str | None = None,
    ):
        self.formula = formula
        self.suggestion = suggestion
        super().__init__(message)