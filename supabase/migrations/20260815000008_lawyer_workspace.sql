-- Lawyer Workspace Migration

CREATE TABLE lawyer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    bar_number TEXT,
    jurisdictions TEXT[],
    specialties TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lawyers can view their own profile" ON lawyer_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Anyone can view verified lawyers" ON lawyer_profiles
    FOR SELECT USING (is_verified = TRUE);

CREATE TABLE lawyer_case_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id),
    lawyer_id UUID NOT NULL REFERENCES lawyer_profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(case_id, lawyer_id)
);

ALTER TABLE lawyer_case_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their case assignments" ON lawyer_case_assignments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM cases WHERE cases.id = lawyer_case_assignments.case_id AND cases.user_id = auth.uid())
    );

CREATE POLICY "Lawyers can view their own assignments" ON lawyer_case_assignments
    FOR SELECT USING (lawyer_id = auth.uid());

CREATE POLICY "Verified lawyers can update their assignments" ON lawyer_case_assignments
    FOR UPDATE USING (lawyer_id = auth.uid() AND EXISTS (SELECT 1 FROM lawyer_profiles WHERE id = auth.uid() AND is_verified = TRUE));

CREATE TABLE lawyer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id),
    lawyer_id UUID NOT NULL REFERENCES lawyer_profiles(id),
    review_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE lawyer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews for their cases" ON lawyer_reviews
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM cases WHERE cases.id = lawyer_reviews.case_id AND cases.user_id = auth.uid())
    );
    
CREATE POLICY "Lawyers can manage their own reviews" ON lawyer_reviews
    FOR ALL USING (lawyer_id = auth.uid());

CREATE TABLE lawyer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    case_id UUID NOT NULL REFERENCES cases(id),
    status TEXT NOT NULL CHECK (status IN ('open', 'matched', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE lawyer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their requests" ON lawyer_requests
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Verified lawyers can view open requests" ON lawyer_requests
    FOR SELECT USING (
        status = 'open' AND EXISTS (SELECT 1 FROM lawyer_profiles WHERE id = auth.uid() AND is_verified = TRUE)
    );

CREATE TABLE lawyer_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE lawyer_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and assigned lawyers can read messages" ON lawyer_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM cases WHERE cases.id = lawyer_messages.case_id AND cases.user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM lawyer_case_assignments WHERE lawyer_case_assignments.case_id = lawyer_messages.case_id AND lawyer_case_assignments.lawyer_id = auth.uid())
    );

CREATE POLICY "Users and assigned lawyers can send messages" ON lawyer_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND (
            EXISTS (SELECT 1 FROM cases WHERE cases.id = lawyer_messages.case_id AND cases.user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM lawyer_case_assignments WHERE lawyer_case_assignments.case_id = lawyer_messages.case_id AND lawyer_case_assignments.lawyer_id = auth.uid())
        )
    );

CREATE TABLE lawyer_case_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id),
    lawyer_id UUID NOT NULL REFERENCES lawyer_profiles(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE lawyer_case_notes ENABLE ROW LEVEL SECURITY;

-- Only the specific lawyer can view their own private notes.
CREATE POLICY "Lawyers can manage their own private notes" ON lawyer_case_notes
    FOR ALL USING (lawyer_id = auth.uid());
