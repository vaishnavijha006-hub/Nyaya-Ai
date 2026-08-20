def calculate_progress(case_details, completed_steps, total_steps):
    """
    Calculates the progress percentage of a case.
    """
    if total_steps == 0:
        return 0
    return int((completed_steps / total_steps) * 100)
