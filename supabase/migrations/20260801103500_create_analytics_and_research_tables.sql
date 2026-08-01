-- SQL Migration: 20260801103500_create_analytics_and_research_tables.sql
-- Description: Ensures research_sessions, research_notes, and analytics_events tables exist with RLS policies, indexes, and full support for anonymous & authenticated users.

-- 1. Create research_sessions table
CREATE TABLE IF NOT EXISTS public.research_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    detected_language VARCHAR(50) DEFAULT 'english',
    sources JSONB DEFAULT '[]'::jsonb,
    articles_retrieved TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for research_sessions
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own research sessions" ON public.research_sessions;
CREATE POLICY "Allow users to read their own research sessions"
    ON public.research_sessions FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own research sessions" ON public.research_sessions;
CREATE POLICY "Allow users to insert their own research sessions"
    ON public.research_sessions FOR INSERT
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own research sessions" ON public.research_sessions;
CREATE POLICY "Allow users to delete their own research sessions"
    ON public.research_sessions FOR DELETE
    USING (user_id IS NULL OR auth.uid() = user_id);

-- 2. Create research_notes table
CREATE TABLE IF NOT EXISTS public.research_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for research_notes
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own research notes" ON public.research_notes;
CREATE POLICY "Allow users to read their own research notes"
    ON public.research_notes FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own research notes" ON public.research_notes;
CREATE POLICY "Allow users to insert their own research notes"
    ON public.research_notes FOR INSERT
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own research notes" ON public.research_notes;
CREATE POLICY "Allow users to update their own research notes"
    ON public.research_notes FOR UPDATE
    USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own research notes" ON public.research_notes;
CREATE POLICY "Allow users to delete their own research notes"
    ON public.research_notes FOR DELETE
    USING (user_id IS NULL OR auth.uid() = user_id);

-- 3. Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own analytics events" ON public.analytics_events;
CREATE POLICY "Allow users to read their own analytics events"
    ON public.analytics_events FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own analytics events" ON public.analytics_events;
CREATE POLICY "Allow users to insert their own analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON public.research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_at ON public.research_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_notes_user_id ON public.research_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_session_id ON public.research_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
