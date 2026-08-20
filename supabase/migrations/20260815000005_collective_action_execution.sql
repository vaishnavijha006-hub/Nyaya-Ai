-- supabase/migrations/20260815000005_collective_action_execution.sql

-- 1. collective_action_plans
CREATE TABLE IF NOT EXISTS public.collective_action_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_id UUID NOT NULL, -- references cluster id if any
    title TEXT NOT NULL,
    description TEXT,
    strategy TEXT, -- overall strategy
    status TEXT DEFAULT 'proposed', -- proposed, active, completed, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. collective_case_summaries
CREATE TABLE IF NOT EXISTS public.collective_case_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.collective_action_plans(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    legal_basis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. collective_consents
CREATE TABLE IF NOT EXISTS public.collective_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.collective_action_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, given, revoked
    consent_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. collective_representatives
CREATE TABLE IF NOT EXISTS public.collective_representatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.collective_action_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT, -- lead_petitioner, coordinator
    status TEXT DEFAULT 'nominated', -- nominated, accepted, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. collective_referrals
CREATE TABLE IF NOT EXISTS public.collective_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.collective_action_plans(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    status TEXT DEFAULT 'pending',
    referred_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. collective_documents
CREATE TABLE IF NOT EXISTS public.collective_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.collective_action_plans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT, -- petition, notice, evidence_bundle
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. collective_updates
CREATE TABLE IF NOT EXISTS public.collective_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.collective_action_plans(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.collective_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_case_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_updates ENABLE ROW LEVEL SECURITY;

-- Creating basic policies for authenticated users
CREATE POLICY "Enable read access for all authenticated users" ON public.collective_action_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.collective_case_summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.collective_consents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.collective_representatives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.collective_referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.collective_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.collective_updates FOR SELECT TO authenticated USING (true);

-- Allow inserts (needs stricter control in reality, but this is a start)
CREATE POLICY "Enable insert for authenticated users" ON public.collective_action_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.collective_action_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
