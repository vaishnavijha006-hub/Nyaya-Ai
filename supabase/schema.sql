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
-- Create the lawyers table

CREATE TABLE IF NOT EXISTS public.lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    location TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL,
    bio TEXT NOT NULL,
    experience_years INTEGER NOT NULL,
    verified BOOLEAN DEFAULT false,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read the lawyers directory
CREATE POLICY "Anyone can view lawyers" ON public.lawyers
    FOR SELECT USING (true);

-- Insert Mock Data
INSERT INTO public.lawyers (name, avatar_url, location, rating, bio, experience_years, verified, specialties) VALUES
('Adv. Vikram Sharma', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop', 'Delhi', 4.9, 'Senior advocate specializing in constitutional and corporate law at the Delhi High Court.', 15, true, ARRAY['Constitutional Law', 'Corporate Law']),
('Adv. Priya Patel', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', 'Mumbai', 4.8, 'Expert in family law and dispute resolution. Dedicated to providing compassionate legal support.', 8, true, ARRAY['Family Law', 'Civil Litigation']),
('Adv. Rohan Desai', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', 'Bangalore', 4.7, 'Tech-focused lawyer handling intellectual property and startup advisory.', 12, true, ARRAY['Intellectual Property', 'Corporate Law']),
('Adv. Anita Reddy', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', 'Hyderabad', 4.9, 'Leading criminal defense lawyer with a track record of high-profile acquittals.', 20, true, ARRAY['Criminal Law', 'Cyber Law']),
('Adv. Sanjay Gupta', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', 'Chennai', 4.6, 'Property and real estate legal expert handling major disputes and title verifications.', 10, false, ARRAY['Property Law', 'Civil Litigation'])
ON CONFLICT DO NOTHING;
/*
# Create conversations and messages tables (single-tenant, no auth)

1. New Tables
- `conversations`
  - `id` (uuid, primary key)
  - `title` (text, not null) — short label shown in the sidebar history
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
- `messages`
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, foreign key to conversations, cascade delete)
  - `role` (text, not null) — 'user' | 'assistant'
  - `content` (text, not null) — message body
  - `citations` (jsonb, nullable) — array of citation objects attached to assistant messages
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- Single-tenant app with no sign-in: allow anon + authenticated full CRUD because the data is intentionally shared/public across the single browser session.
- USING (true) / WITH CHECK (true) is acceptable here because there is no per-user ownership concept in this app.

3. Notes
- `citations` stored as jsonb so assistant responses can carry their source cards without a separate table.
- Cascade delete on `messages.conversation_id` so deleting a conversation cleans up its messages.
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "anon_delete_conversations" ON conversations FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  citations jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
/*
# Add per-user ownership and secure RLS to conversations & messages

## Why
The previous policies used USING (true) / WITH CHECK (true), which let any
anonymous client read, modify, or delete every row. This migration converts
the app to a multi-user (sign-in required) model with real ownership checks.

## Changes
1. New columns
   - conversations.user_id (uuid, NOT NULL, DEFAULT auth.uid(), references auth.users, ON DELETE CASCADE)
   - messages.user_id (uuid, NOT NULL, DEFAULT auth.uid(), references auth.users, ON DELETE CASCADE)
   Both default to auth.uid() so frontend inserts that omit user_id still
   satisfy the WITH CHECK ownership predicate.

2. Existing rows
   - conversations already had no user_id. We add the column as nullable first,
     backfill NULL rows to a sentinel-free state by deleting them (they were
     created by the old always-true anon policies and have no owner), then set
     NOT NULL. This avoids assigning orphan rows to a wrong user.
   - messages.user_id is added and backfilled from the parent conversation's
     user_id via the FK join, then set NOT NULL.

3. Security (RLS)
   - RLS stays enabled on both tables.
   - Drop the six always-true anon_* policies.
   - Create four ownership-scoped policies per table (SELECT/INSERT/UPDATE/DELETE),
     scoped TO authenticated, using auth.uid() = user_id. No anon access —
     the app now requires sign-in.

4. Notes
   - No DROP TABLE, no column type changes, no renames. Only additive column
     additions + policy replacement.
   - Idempotent: columns use DO $$ IF NOT EXISTS guards; policies drop-if-exists
     before recreate.
*/

-- 1a. Add conversations.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill: remove orphaned ownerless rows, then set NOT NULL with default.
DELETE FROM public.conversations WHERE user_id IS NULL;
ALTER TABLE public.conversations ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.conversations ALTER COLUMN user_id SET NOT NULL;

-- 1b. Add messages.user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill messages.user_id from their parent conversation, then NOT NULL.
UPDATE public.messages m
SET user_id = c.user_id
FROM public.conversations c
WHERE m.conversation_id = c.id AND m.user_id IS NULL;

DELETE FROM public.messages WHERE user_id IS NULL;
ALTER TABLE public.messages ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.messages ALTER COLUMN user_id SET NOT NULL;

-- Index for ownership-filtered queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id, created_at);

-- 2. Replace policies on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_conversations" ON public.conversations;
DROP POLICY IF EXISTS "anon_insert_conversations" ON public.conversations;
DROP POLICY IF EXISTS "anon_update_conversations" ON public.conversations;
DROP POLICY IF EXISTS "anon_delete_conversations" ON public.conversations;

CREATE POLICY "select_own_conversations" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_conversations" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_conversations" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_conversations" ON public.conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Replace policies on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON public.messages;
DROP POLICY IF EXISTS "anon_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "anon_update_messages" ON public.messages;
DROP POLICY IF EXISTS "anon_delete_messages" ON public.messages;

CREATE POLICY "select_own_messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_messages" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_messages" ON public.messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
-- SQL migration for Nyaya AI - iNSIGHTS Alignment
-- Run these statements in your Supabase SQL editor

-- 1. Create research_sessions table to store query history and retrieved chunks
CREATE TABLE IF NOT EXISTS public.research_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    answer TEXT NOT NULL,
    detected_language VARCHAR(50) DEFAULT 'english',
    sources JSONB DEFAULT '[]'::jsonb,
    articles_retrieved TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for research_sessions
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own research sessions"
    ON public.research_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own research sessions"
    ON public.research_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own research sessions"
    ON public.research_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Create research_notes table to store AI-generated notes/summaries linked to sessions
CREATE TABLE IF NOT EXISTS public.research_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
    notes TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for research_notes
ALTER TABLE public.research_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own research notes"
    ON public.research_notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own research notes"
    ON public.research_notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own research notes"
    ON public.research_notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own research notes"
    ON public.research_notes FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Create analytics_events table to capture events for project analytics page
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL, -- 'query', 'generate_notes', 'sign_in', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own analytics events"
    ON public.analytics_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own analytics events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON public.research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_user_id ON public.research_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_session_id ON public.research_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
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
