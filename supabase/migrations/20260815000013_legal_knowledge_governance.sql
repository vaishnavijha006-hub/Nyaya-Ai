-- Legal Knowledge Governance & Source Verification Engine (TRUST)

-- 1. legal_source_versions
CREATE TABLE IF NOT EXISTS public.legal_source_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL, -- references original source, assuming some sources table
    title TEXT NOT NULL,
    content TEXT,
    version_number TEXT,
    effective_date TIMESTAMP WITH TIME ZONE,
    superseded_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'repealed', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. legal_amendments
CREATE TABLE IF NOT EXISTS public.legal_amendments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_version_id UUID REFERENCES public.legal_source_versions(id) ON DELETE CASCADE,
    amendment_text TEXT,
    amendment_date TIMESTAMP WITH TIME ZONE,
    applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. legal_source_provenance
CREATE TABLE IF NOT EXISTS public.legal_source_provenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_version_id UUID REFERENCES public.legal_source_versions(id) ON DELETE CASCADE,
    origin_url TEXT,
    fetch_date TIMESTAMP WITH TIME ZONE,
    publisher TEXT,
    digital_signature TEXT,
    hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. legal_source_relationships
CREATE TABLE IF NOT EXISTS public.legal_source_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_version_id UUID REFERENCES public.legal_source_versions(id) ON DELETE CASCADE,
    target_version_id UUID REFERENCES public.legal_source_versions(id) ON DELETE CASCADE,
    relationship_type TEXT CHECK (relationship_type IN ('amends', 'repeals', 'cites', 'interprets')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. legal_source_reviews
CREATE TABLE IF NOT EXISTS public.legal_source_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_version_id UUID REFERENCES public.legal_source_versions(id) ON DELETE CASCADE,
    reviewer_id UUID,
    trust_score NUMERIC(5,2) DEFAULT 0.0,
    review_notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. legal_ingestion_jobs
CREATE TABLE IF NOT EXISTS public.legal_ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    log_messages JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
