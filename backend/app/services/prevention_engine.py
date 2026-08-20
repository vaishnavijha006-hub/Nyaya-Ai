from .legal_risk_detector import legal_risk_detector

class PreventionEngine:
    def __init__(self):
        pass

    def run_prevention_pipeline(self, context_data: dict) -> dict:
        try:
            risks = legal_risk_detector.detect_risks(context_data)
        except ValueError as e:
            return {"status": "halted", "reason": str(e)}

        return {
            "status": "success",
            "risks": risks,
            "recommendations": []
        }

prevention_engine = PreventionEngine()
