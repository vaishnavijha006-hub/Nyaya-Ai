-- Governance Policies
CREATE TABLE public.governance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_name VARCHAR(255) NOT NULL,
    policy_version VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance Decisions
CREATE TABLE public.governance_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES public.governance_policies(id),
    decision_type VARCHAR(100) NOT NULL,
    decision_result VARCHAR(100) NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Consents
CREATE TABLE public.user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    is_granted BOOLEAN NOT NULL DEFAULT false,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    metadata JSONB,
    UNIQUE(user_id, consent_type)
);

-- Human Review Requirements
CREATE TABLE public.human_review_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id UUID,
    reference_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES auth.users(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Data Sharing Events
CREATE TABLE public.data_sharing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    destination VARCHAR(255) NOT NULL,
    data_shared JSONB,
    consent_id UUID REFERENCES public.user_consents(id),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance Incidents
CREATE TABLE public.governance_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    details JSONB,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.governance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_review_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sharing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_incidents ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view their own consents" ON public.user_consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own consents" ON public.user_consents FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own decisions" ON public.governance_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own data sharing events" ON public.data_sharing_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own incidents" ON public.governance_incidents FOR SELECT USING (auth.uid() = user_id);
