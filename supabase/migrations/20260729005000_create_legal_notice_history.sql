-- ============================================================
-- Migration: create_legal_notice_history
-- Creates the legal_notice_history table with RLS policies.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.legal_notice_history (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID            NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    notice_type TEXT            NOT NULL,
    recipient   TEXT            NOT NULL,
    notice      TEXT            NOT NULL,
    language    TEXT            NOT NULL DEFAULT 'English',
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Indexes for fast user-scoped lookups
CREATE INDEX IF NOT EXISTS idx_legal_notice_history_user_id
    ON public.legal_notice_history (user_id);

CREATE INDEX IF NOT EXISTS idx_legal_notice_history_created_at
    ON public.legal_notice_history (created_at DESC);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
ALTER TABLE public.legal_notice_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own records
CREATE POLICY "Users can view own legal notice history"
    ON public.legal_notice_history
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert own legal notice history"
    ON public.legal_notice_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete own legal notice history"
    ON public.legal_notice_history
    FOR DELETE
    USING (auth.uid() = user_id);
