import re

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\api\chat.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace in stream endpoint
stream_search = '''            if not is_complete and missing and follow_up_count < MAX_FOLLOWUP_QUESTIONS:
                followup_q = await run_in_threadpool(generate_smart_followup, missing, case_info, lang)
                update_state(session_id, {"follow_up_count": follow_up_count + 1})
                yield f"data: {json.dumps({'type': 'token', 'content': followup_q})}\\n\\n"'''
stream_replace = '''            if not is_complete and missing and follow_up_count < MAX_FOLLOWUP_QUESTIONS:
                asked_questions = state.get("asked_questions", [])
                followup_q = await run_in_threadpool(generate_smart_followup, missing, case_info, lang, asked_questions)
                
                # Double check to prevent exact duplicate
                if followup_q in asked_questions:
                    # just give a generic prompt
                    followup_q = "Could you provide more details about the incident?"
                
                asked_questions.append(followup_q)
                update_state(session_id, {"follow_up_count": follow_up_count + 1, "asked_questions": asked_questions})
                yield f"data: {json.dumps({'type': 'token', 'content': followup_q})}\\n\\n"'''
content = content.replace(stream_search, stream_replace)

# Replace in non-stream endpoint
sync_search = '''        if not is_complete and missing and state.get("follow_up_count", 0) < MAX_FOLLOWUP_QUESTIONS:
            followup_q = await run_in_threadpool(generate_smart_followup, missing, case_info, target_lang)
            update_state(session_id, {"follow_up_count": state.get("follow_up_count", 0) + 1})'''
sync_replace = '''        if not is_complete and missing and state.get("follow_up_count", 0) < MAX_FOLLOWUP_QUESTIONS:
            asked_questions = state.get("asked_questions", [])
            followup_q = await run_in_threadpool(generate_smart_followup, missing, case_info, target_lang, asked_questions)
            if followup_q in asked_questions:
                followup_q = "Could you provide more details about the incident?"
            asked_questions.append(followup_q)
            update_state(session_id, {"follow_up_count": state.get("follow_up_count", 0) + 1, "asked_questions": asked_questions})'''
content = content.replace(sync_search, sync_replace)

with open(r'c:\Users\sapna jha\Downloads\Nyaya-AI\Nyaya-Ai\backend\app\api\chat.py', 'w', encoding='utf-8') as f:
    f.write(content)
