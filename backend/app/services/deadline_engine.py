from datetime import datetime, timedelta

def calculate_deadlines(case_type, event_date_str):
    """
    Calculates deadlines based on case type.
    """
    event_date = datetime.fromisoformat(event_date_str.replace('Z', '+00:00')) if isinstance(event_date_str, str) else event_date_str
    return {
        "response_due": (event_date + timedelta(days=30)).isoformat(),
        "appeal_due": (event_date + timedelta(days=60)).isoformat()
    }
