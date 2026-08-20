-- Migration: 20260815000003_create_authority_complaints.sql
-- Description: Creates tables for Authority Complaint, Submission & E-Filing Integration Engine

CREATE TABLE public.authority_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.authority_complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    authority_id UUID REFERENCES public.authority_types(id) ON DELETE SET NULL,
    complaint_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.complaint_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    complaint_id UUID REFERENCES public.authority_complaints(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    document_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.complaint_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    complaint_id UUID REFERENCES public.authority_complaints(id) ON DELETE CASCADE,
    submission_status VARCHAR(50) DEFAULT 'pending',
    submission_reference VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.complaint_followups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID REFERENCES public.complaint_submissions(id) ON DELETE CASCADE,
    followup_notes TEXT,
    followup_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.authority_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id UUID REFERENCES public.complaint_submissions(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.authority_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.authority_types FOR SELECT USING (true);

CREATE POLICY "Users can manage their own complaints" ON public.authority_complaints
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage documents of their complaints" ON public.complaint_documents
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.authority_complaints WHERE id = complaint_id));

CREATE POLICY "Users can view submissions of their complaints" ON public.complaint_submissions
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.authority_complaints WHERE id = complaint_id));
CREATE POLICY "Users can manage submissions of their complaints" ON public.complaint_submissions
    FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.authority_complaints WHERE id = complaint_id));

CREATE POLICY "Users can view followups of their submissions" ON public.complaint_followups
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.authority_complaints WHERE id = (SELECT complaint_id FROM public.complaint_submissions WHERE id = submission_id)));

CREATE POLICY "Users can view responses of their submissions" ON public.authority_responses
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.authority_complaints WHERE id = (SELECT complaint_id FROM public.complaint_submissions WHERE id = submission_id)));
