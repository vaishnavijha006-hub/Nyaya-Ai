-- Migration: Case Progress & Response Intelligence Engine

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: case_progress_snapshots
CREATE TABLE IF NOT EXISTS public.case_progress_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- e.g., 'INITIATED', 'ESCALATED', 'RESOLVED'
    progress_percentage INTEGER DEFAULT 0,
    snapshot_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: authority_response_analysis
CREATE TABLE IF NOT EXISTS public.authority_response_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    authority_name TEXT NOT NULL,
    response_status TEXT NOT NULL, -- e.g., 'FAVORABLE', 'AMBIGUOUS', 'HUMAN_REVIEW_REQUIRED'
    analysis_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: case_deadlines
CREATE TABLE IF NOT EXISTS public.case_deadlines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    deadline_type TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'PENDING',
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: escalation_events
CREATE TABLE IF NOT EXISTS public.escalation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    escalation_level INTEGER NOT NULL,
    reason TEXT,
    escalated_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: case_response_documents
CREATE TABLE IF NOT EXISTS public.case_response_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    document_type TEXT,
    extracted_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.case_progress_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_response_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_response_documents ENABLE ROW LEVEL SECURITY;

-- Policies for case_progress_snapshots
CREATE POLICY "Users can view their own progress snapshots" ON public.case_progress_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress snapshots" ON public.case_progress_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress snapshots" ON public.case_progress_snapshots FOR UPDATE USING (auth.uid() = user_id);

-- Policies for authority_response_analysis
CREATE POLICY "Users can view their own response analysis" ON public.authority_response_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own response analysis" ON public.authority_response_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own response analysis" ON public.authority_response_analysis FOR UPDATE USING (auth.uid() = user_id);

-- Policies for case_deadlines
CREATE POLICY "Users can view their own case deadlines" ON public.case_deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own case deadlines" ON public.case_deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own case deadlines" ON public.case_deadlines FOR UPDATE USING (auth.uid() = user_id);

-- Policies for escalation_events
CREATE POLICY "Users can view their own escalation events" ON public.escalation_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own escalation events" ON public.escalation_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for case_response_documents
CREATE POLICY "Users can view their own response documents" ON public.case_response_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own response documents" ON public.case_response_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
