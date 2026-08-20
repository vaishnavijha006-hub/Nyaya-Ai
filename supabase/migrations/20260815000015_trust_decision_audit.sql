-- TRUST++ Legal Decision Audit & Explainability Engine

CREATE TABLE IF NOT EXISTS public.legal_decision_audits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    case_id UUID,
    query TEXT NOT NULL,
    generated_response TEXT NOT NULL,
    ai_model_version TEXT,
    confidence_score FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.legal_claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES public.legal_decision_audits(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    support_status TEXT CHECK (support_status IN ('VERIFIED', 'UNVERIFIED', 'CONTRADICTED', 'PARTIAL')),
    verified_sources JSONB,
    verification_reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompt_registry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_name TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    system_instructions TEXT,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_human_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    audit_id UUID REFERENCES public.legal_decision_audits(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id),
    review_status TEXT CHECK (review_status IN ('APPROVED', 'REJECTED', 'NEEDS_REVISION')),
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_user ON public.legal_decision_audits(user_id);
CREATE INDEX idx_audit_case ON public.legal_decision_audits(case_id);
CREATE INDEX idx_claim_audit ON public.legal_claims(audit_id);
CREATE INDEX idx_human_review_audit ON public.legal_human_reviews(audit_id);

-- RLS and Policies
ALTER TABLE public.legal_decision_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_human_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audits" ON public.legal_decision_audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert audits" ON public.legal_decision_audits FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view claims of their audits" ON public.legal_claims FOR SELECT USING (
    audit_id IN (SELECT id FROM public.legal_decision_audits WHERE user_id = auth.uid())
);
CREATE POLICY "System can insert claims" ON public.legal_claims FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view active prompts" ON public.prompt_registry FOR SELECT USING (active = true);

CREATE POLICY "Reviewers can view all reviews" ON public.legal_human_reviews FOR SELECT USING (auth.uid() IN (SELECT id FROM auth.users /* Add role check here if roles exist */));
CREATE POLICY "Reviewers can insert reviews" ON public.legal_human_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
