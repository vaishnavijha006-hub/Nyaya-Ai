-- Migration: 20260815000002_create_case_resolution_tracking.sql
-- Description: Create case_workflows, case_timeline, case_tasks, case_updates, and case_resolution tables

CREATE TABLE IF NOT EXISTS public.case_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    current_stage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.case_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.case_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    task_name TEXT NOT NULL,
    task_status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.case_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    update_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.case_resolution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    resolution_status TEXT NOT NULL,
    resolution_details TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.case_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_resolution ENABLE ROW LEVEL SECURITY;

-- Policies for case_workflows
CREATE POLICY "Users can view own case workflows" ON public.case_workflows
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case workflows" ON public.case_workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own case workflows" ON public.case_workflows
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for case_timeline
CREATE POLICY "Users can view own case timeline" ON public.case_timeline
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case timeline" ON public.case_timeline
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for case_tasks
CREATE POLICY "Users can view own case tasks" ON public.case_tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case tasks" ON public.case_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own case tasks" ON public.case_tasks
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for case_updates
CREATE POLICY "Users can view own case updates" ON public.case_updates
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case updates" ON public.case_updates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for case_resolution
CREATE POLICY "Users can view own case resolution" ON public.case_resolution
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case resolution" ON public.case_resolution
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own case resolution" ON public.case_resolution
    FOR UPDATE USING (auth.uid() = user_id);
