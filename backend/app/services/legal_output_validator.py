from typing import List, Dict, Any, Tuple

class LegalOutputValidator:
    def __init__(self, claim_validator):
        self.claim_validator = claim_validator

    def validate_output(self, generated_text: str, claims: List[Dict[str, Any]], sources: List[Dict[str, Any]]) -> Tuple[bool, str]:
        """
        Validates the generated legal output. 
        Blocks output if claims lack verified support.
        """
        for claim in claims:
            is_supported, reason = self.claim_validator.validate_claim(claim, sources)
            if not is_supported:
                # Block output if any claim lacks support
                return False, f"Output blocked: Claim '{claim.get('text')}' lacks verified support. Reason: {reason}"
                
        return True, "Output validated successfully."
