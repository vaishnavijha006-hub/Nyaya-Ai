-- Emergency & Safety Features Migration

CREATE TABLE IF NOT EXISTS public.trusted_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    relation TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    risk_level TEXT NOT NULL, -- URGENT, HIGH_PRIORITY, EMERGENCY
    category TEXT,
    message TEXT,
    location JSONB, -- {lat, lng, address}
    status TEXT DEFAULT 'active', -- active, resolved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.emergency_evidence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.emergency_events(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emergency_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT, -- helpline, ngo, police
    phone_number TEXT,
    description TEXT,
    state TEXT,
    city TEXT,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_resources ENABLE ROW LEVEL SECURITY;

-- Trusted Contacts: Users can read and write their own
CREATE POLICY "Users can manage their own trusted contacts" ON public.trusted_contacts
    FOR ALL USING (auth.uid() = user_id);

-- Emergency Events: Users can read and write their own
CREATE POLICY "Users can manage their own emergency events" ON public.emergency_events
    FOR ALL USING (auth.uid() = user_id);

-- Emergency Evidence: Users can read and write their own
CREATE POLICY "Users can manage their own evidence" ON public.emergency_evidence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.emergency_events 
            WHERE id = event_id AND user_id = auth.uid()
        )
    );

-- Emergency Resources: Anyone can read
CREATE POLICY "Anyone can read verified resources" ON public.emergency_resources
    FOR SELECT USING (is_verified = true);
