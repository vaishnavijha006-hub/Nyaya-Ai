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
