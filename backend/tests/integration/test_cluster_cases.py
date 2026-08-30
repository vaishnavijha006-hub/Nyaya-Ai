import pytest
import asyncio
from app.api.collective_actions import _planner

@pytest.mark.asyncio
async def test_cluster_case_filing_isolation():
    tenant_1 = "tenant_1"
    tenant_2 = "tenant_2"
    
    # Simulate a complaint embedding for tenant 1
    emb_1 = [0.1] * 384
    
    # 1. Create plan for tenant 1
    plan_1 = await _planner.plan_collective_action(
        tenant_id=tenant_1,
        cluster_id="cluster_1",
        case_ids=["case_1", "case_2"],
        cluster_embedding=emb_1,
        complaint_text="Landlord locked us out without notice"
    )
    
    assert plan_1["tenant_id"] == tenant_1
    assert "Initiate collective action" in plan_1["strategy"]
    
    # 2. Simulate similar complaint for tenant 1 - should find past strategy
    plan_1_similar = await _planner.plan_collective_action(
        tenant_id=tenant_1,
        cluster_id="cluster_1_sim",
        case_ids=["case_3"],
        cluster_embedding=emb_1, # Same embedding
        complaint_text="Locked out of apartment by landlord"
    )
    
    assert "Aligned with past successful strategy" in plan_1_similar["strategy"]
    
    # 3. Simulate same embedding for tenant 2 - should NOT find tenant 1's strategy
    plan_2 = await _planner.plan_collective_action(
        tenant_id=tenant_2,
        cluster_id="cluster_2",
        case_ids=["case_4"],
        cluster_embedding=emb_1, # Same embedding but different tenant
        complaint_text="Locked out"
    )
    
    assert plan_2["tenant_id"] == tenant_2
    assert "Aligned with past successful strategy" not in plan_2["strategy"]

    # 4. Get plan isolation
    fetched_plan_2 = await _planner.get_plan(plan_2["id"], tenant_id=tenant_2)
    assert fetched_plan_2["id"] == plan_2["id"]
    
    fetched_plan_2_wrong_tenant = await _planner.get_plan(plan_2["id"], tenant_id=tenant_1)
    assert fetched_plan_2_wrong_tenant == {}
