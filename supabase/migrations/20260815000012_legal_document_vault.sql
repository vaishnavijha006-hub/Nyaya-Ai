CREATE TABLE IF NOT EXISTS legal_document_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    case_id UUID,
    title TEXT NOT NULL,
    original_file_path TEXT NOT NULL,
    file_type TEXT,
    status TEXT DEFAULT 'UPLOADED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES legal_document_vault(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    file_path TEXT NOT NULL,
    changes_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_extracted_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES legal_document_vault(id) ON DELETE CASCADE,
    fact_text TEXT NOT NULL,
    confidence_score FLOAT,
    page_num INT,
    bounding_box JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_doc_id UUID NOT NULL REFERENCES legal_document_vault(id) ON DELETE CASCADE,
    target_doc_id UUID NOT NULL REFERENCES legal_document_vault(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES legal_document_vault(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    page_num INT,
    bounding_box JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES legal_document_vault(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Boundaries
ALTER TABLE legal_document_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_extracted_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own documents"
ON legal_document_vault FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access versions of their documents"
ON legal_document_versions FOR ALL USING (EXISTS (SELECT 1 FROM legal_document_vault d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE POLICY "Users can access facts of their documents"
ON document_extracted_facts FOR ALL USING (EXISTS (SELECT 1 FROM legal_document_vault d WHERE d.id = document_id AND d.user_id = auth.uid()));

CREATE POLICY "Users can access relationships of their documents"
ON document_relationships FOR ALL USING (EXISTS (SELECT 1 FROM legal_document_vault d WHERE d.id = source_doc_id AND d.user_id = auth.uid()));

CREATE POLICY "Users can access their annotations"
ON document_annotations FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access logs of their documents"
ON document_access_logs FOR ALL USING (EXISTS (SELECT 1 FROM legal_document_vault d WHERE d.id = document_id AND d.user_id = auth.uid()));
