-- Migration to create legal_sources table for Indian Law Finder
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.legal_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    act_name TEXT,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.legal_sources ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to legal_sources"
ON public.legal_sources FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS ix_legal_sources_metadata ON public.legal_sources USING GIN (metadata);
CREATE INDEX IF NOT EXISTS ix_legal_sources_embedding ON public.legal_sources USING hnsw (embedding vector_cosine_ops);
