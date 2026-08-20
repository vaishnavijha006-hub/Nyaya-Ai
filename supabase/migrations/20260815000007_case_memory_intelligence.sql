-- Migration: 20260815000007_case_memory_intelligence.sql

CREATE TABLE IF NOT EXISTS case_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    core_narrative TEXT NOT NULL,
    current_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_memory_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_memory_id UUID NOT NULL REFERENCES case_memory(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    core_narrative TEXT NOT NULL,
    changes_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_memory_id UUID NOT NULL REFERENCES case_memory(id) ON DELETE CASCADE,
    fact_key VARCHAR(255) NOT NULL,
    fact_value TEXT NOT NULL,
    confidence FLOAT DEFAULT 1.0,
    source_message_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_contradictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_memory_id UUID NOT NULL REFERENCES case_memory(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'UNRESOLVED', -- UNRESOLVED, RESOLVED
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    is_latest BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE case_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_memory_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_summaries ENABLE ROW LEVEL SECURITY;

-- Strict RLS Policies (Assuming user_id check is needed, or just service role)
CREATE POLICY "Users can access their own case memory" ON case_memory FOR ALL USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access their own case memory versions" ON case_memory_versions FOR ALL USING (
    case_memory_id IN (SELECT id FROM case_memory WHERE case_id IN (SELECT id FROM cases WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can access their own case facts" ON case_facts FOR ALL USING (
    case_memory_id IN (SELECT id FROM case_memory WHERE case_id IN (SELECT id FROM cases WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can access their own case contradictions" ON case_contradictions FOR ALL USING (
    case_memory_id IN (SELECT id FROM case_memory WHERE case_id IN (SELECT id FROM cases WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can access their own case summaries" ON case_summaries FOR ALL USING (
    case_id IN (SELECT id FROM cases WHERE user_id = auth.uid())
);

-- Triggers for updated_at
CREATE TRIGGER update_case_memory_updated_at BEFORE UPDATE ON case_memory FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER update_case_facts_updated_at BEFORE UPDATE ON case_facts FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER update_case_contradictions_updated_at BEFORE UPDATE ON case_contradictions FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
