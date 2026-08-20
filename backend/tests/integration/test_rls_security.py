import pytest
import uuid
import psycopg2

def test_user_a_to_user_b_block(auth_client):
    user_a = str(uuid.uuid4())
    user_b = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    
    # User A creates a case
    res = auth_client.execute(user_a, """
        INSERT INTO cases (tenant_id, user_id, title, status)
        VALUES (%s, %s, 'Case A', 'Open')
        RETURNING id
    """, (tenant_id, user_a))
    case_id = res[0]['id']
    
    # User B tries to read the case
    res_b = auth_client.execute(user_b, "SELECT * FROM cases WHERE id = %s", (case_id,))
    assert len(res_b) == 0, "User B should not be able to read User A's case"

def test_lawyer_a_unassigned_block(auth_client):
    user_a = str(uuid.uuid4())
    lawyer_a = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    
    res = auth_client.execute(user_a, """
        INSERT INTO cases (tenant_id, user_id, title, status)
        VALUES (%s, %s, 'Case for Lawyer', 'Open')
        RETURNING id
    """, (tenant_id, user_a))
    case_id = res[0]['id']
    
    # Lawyer A tries to read without assignment
    res_l = auth_client.execute(lawyer_a, "SELECT * FROM cases WHERE id = %s", (case_id,))
    assert len(res_l) == 0, "Lawyer A should not read unassigned case"
    
    # Assign Lawyer A
    auth_client.execute(user_a, """
        INSERT INTO lawyer_assignments (case_id, lawyer_id)
        VALUES (%s, %s)
    """, (case_id, lawyer_a))
    
    # Lawyer A should now be able to read
    res_l2 = auth_client.execute(lawyer_a, "SELECT * FROM cases WHERE id = %s", (case_id,))
    assert len(res_l2) == 1, "Lawyer A should be able to read assigned case"

def test_immutable_logs(auth_client):
    user_a = str(uuid.uuid4())
    target_id = str(uuid.uuid4())
    
    # User A inserts a log
    res = auth_client.execute(user_a, """
        INSERT INTO privacy_access_log (user_id, action, target_id)
        VALUES (%s, 'VIEW', %s)
        RETURNING id
    """, (user_a, target_id))
    log_id = res[0]['id']
    
    # Try to update the log (RLS returns empty instead of throwing error)
    auth_client.execute(user_a, "UPDATE privacy_access_log SET action = 'EDIT' WHERE id = %s", (log_id,))
    res_update = auth_client.execute(user_a, "SELECT action FROM privacy_access_log WHERE id = %s", (log_id,))
    assert res_update[0]['action'] == 'VIEW', "Log should be immutable against updates"
        
    # Try to delete the log
    auth_client.execute(user_a, "DELETE FROM privacy_access_log WHERE id = %s", (log_id,))
    res_delete = auth_client.execute(user_a, "SELECT id FROM privacy_access_log WHERE id = %s", (log_id,))
    assert len(res_delete) == 1, "Log should be immutable against deletes"
