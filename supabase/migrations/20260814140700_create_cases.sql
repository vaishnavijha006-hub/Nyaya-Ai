CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    category TEXT,
    sub_category TEXT,
    issue TEXT,
    parties TEXT,
    location TEXT,
    case_stage TEXT,
    urgency TEXT,
    desired_outcome TEXT,
    evidence_available TEXT,
    missing_information TEXT[],
    confidence FLOAT,
    classification_status TEXT DEFAULT 'INCOMPLETE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for cases
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to read their own cases" ON public.cases;
CREATE POLICY "Allow users to read their own cases"
    ON public.cases FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own cases" ON public.cases;
CREATE POLICY "Allow users to insert their own cases"
    ON public.cases FOR INSERT
    WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own cases" ON public.cases;
CREATE POLICY "Allow users to update their own cases"
    ON public.cases FOR UPDATE
    USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own cases" ON public.cases;
CREATE POLICY "Allow users to delete their own cases"
    ON public.cases FOR DELETE
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_conversation_id ON public.cases(conversation_id);
