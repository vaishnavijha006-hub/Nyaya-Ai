from typing import List, Dict, Any, Tuple

class ClaimSupportValidator:
    def __init__(self):
        pass

    def validate_claim(self, claim: Dict[str, Any], sources: List[Dict[str, Any]]) -> Tuple[bool, str]:
        """
        Validates if a claim is supported by the provided sources.
        Returns a tuple of (is_supported, reason).
        """
        claim_text = claim.get("text", "").lower()
        required_keywords = claim.get("keywords", [])
        
        if not sources:
            return False, "No sources provided to support the claim."
            
        supported = False
        for source in sources:
            source_text = source.get("text", "").lower()
            
            # Simple keyword matching as a proxy for entailment/support checking
            if all(kw.lower() in source_text for kw in required_keywords):
                supported = True
                break
                
        if supported:
            return True, "Claim is supported by the provided sources."
        else:
            return False, "Claim keywords not found in any of the provided sources."
