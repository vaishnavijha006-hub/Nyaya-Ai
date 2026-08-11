-- Create tables for Nyaya-AI User History and Workspaces

CREATE TABLE IF NOT EXISTS public.research_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    detected_language TEXT DEFAULT 'en',
    sources JSONB DEFAULT '[]'::jsonb,
    articles_retrieved TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.research_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE,
    title TEXT,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id) -- one AI generated note per session usually
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users to manage their own data
CREATE POLICY "Users can view own research_sessions" ON public.research_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own research_sessions" ON public.research_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own research_notes" ON public.research_notes
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own research_notes" ON public.research_notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own research_notes" ON public.research_notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics_events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics_events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);
