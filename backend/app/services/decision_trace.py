from typing import List, Dict, Any

class DecisionTrace:
    def __init__(self, trace_id: str):
        self.trace_id = trace_id
        self.steps = []

    def add_step(self, step_name: str, inputs: Dict[str, Any], outputs: Dict[str, Any]):
        self.steps.append({
            "step_name": step_name,
            "inputs": inputs,
            "outputs": outputs
        })

    def get_trace(self) -> Dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "steps": self.steps
        }

    def generate_explanation(self) -> str:
        """
        Generates a human-readable explanation of the decision trace.
        """
        explanation = f"Trace ID: {self.trace_id}\n"
        for i, step in enumerate(self.steps):
            explanation += f"Step {i+1}: {step['step_name']}\n"
            explanation += f"  Inputs: {step['inputs']}\n"
            explanation += f"  Outputs: {step['outputs']}\n"
        return explanation
