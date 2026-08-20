-- Migration: 20260815000020_continuity_case_operations.sql

CREATE TABLE IF NOT EXISTS case_continuity_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    overall_health_score NUMERIC(5,2) DEFAULT 100.0,
    status VARCHAR(50) DEFAULT 'HEALTHY',
    last_evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS continuity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(50),
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS continuity_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    trigger_event_id UUID REFERENCES continuity_events(id),
    intervention_type VARCHAR(100) NOT NULL,
    action_taken TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS continuity_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    owner_id UUID NOT NULL,
    role VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS continuity_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    checkpoint_name VARCHAR(150) NOT NULL,
    checkpoint_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS continuity_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    details TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
