-- Migration to create rti_history table
-- Run these statements in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.rti_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    department VARCHAR(255) NOT NULL,
    authority VARCHAR(255) NOT NULL,
    application TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'English',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for rti_history
ALTER TABLE public.rti_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own RTI history"
    ON public.rti_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own RTI requests"
    ON public.rti_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own RTI history"
    ON public.rti_history FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rti_history_user_id ON public.rti_history(user_id);
