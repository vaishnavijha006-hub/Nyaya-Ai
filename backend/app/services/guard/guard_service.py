from .health_monitor import HealthMonitor
from .provider_health import ProviderHealth
from .rate_limit_engine import RateLimitEngine
from .anomaly_detector import AnomalyDetector
from .job_recovery import JobRecovery
from .incident_engine import IncidentEngine

class GuardService:
    def __init__(self):
        self.health_monitor = HealthMonitor()
        self.provider_health = ProviderHealth()
        self.rate_limit_engine = RateLimitEngine()
        self.anomaly_detector = AnomalyDetector()
        self.job_recovery = JobRecovery()
        self.incident_engine = IncidentEngine()

    async def get_system_status(self):
        sys_health = await self.health_monitor.check_health()
        prov_health = await self.provider_health.check_providers()
        return {
            "system": sys_health,
            "providers": prov_health
        }

    def sanitize_ocr_extraction(self, raw_text: str) -> str:
        """
        Enforce strict boundary for untrusted OCR data to prevent prompt injection.
        """
        escaped_text = raw_text.replace("<UNTRUSTED_DATA>", "").replace("</UNTRUSTED_DATA>", "")
        return f"<UNTRUSTED_DATA>\n{escaped_text}\n</UNTRUSTED_DATA>"

guard_service = GuardService()
