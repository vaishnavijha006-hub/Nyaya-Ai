-- Migration: Data Rights & Privacy Lifecycle Engine RLS Hardening

-- Enable RLS on all tables
ALTER TABLE data_rights_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_status ENABLE ROW LEVEL SECURITY;

-- data_rights_requests: users can only access their own
CREATE POLICY "Users can view their own rights requests"
ON data_rights_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rights requests"
ON data_rights_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rights requests"
ON data_rights_requests FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rights requests"
ON data_rights_requests FOR DELETE
USING (auth.uid() = user_id);

-- data_export_jobs: users can only access their own
CREATE POLICY "Users can view their own export jobs"
ON data_export_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own export jobs"
ON data_export_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own export jobs"
ON data_export_jobs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own export jobs"
ON data_export_jobs FOR DELETE
USING (auth.uid() = user_id);

-- data_correction_requests: users can only access via request_id linking to their own requests
CREATE POLICY "Users can view their own correction requests"
ON data_correction_requests FOR SELECT
USING (EXISTS (
    SELECT 1 FROM data_rights_requests dr
    WHERE dr.id = data_correction_requests.request_id
    AND dr.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own correction requests"
ON data_correction_requests FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM data_rights_requests dr
    WHERE dr.id = data_correction_requests.request_id
    AND dr.user_id = auth.uid()
));

CREATE POLICY "Users can update their own correction requests"
ON data_correction_requests FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM data_rights_requests dr
    WHERE dr.id = data_correction_requests.request_id
    AND dr.user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM data_rights_requests dr
    WHERE dr.id = data_correction_requests.request_id
    AND dr.user_id = auth.uid()
));

-- privacy_access_log: immutable audit records cannot be modified by users
CREATE POLICY "Users can insert their own access logs"
ON privacy_access_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own access logs"
ON privacy_access_log FOR SELECT
USING (auth.uid() = user_id);

-- Explicitly no UPDATE or DELETE policies for privacy_access_log to ensure immutability by users.

-- data_retention_policies: read-only for users
CREATE POLICY "Anyone can view retention policies"
ON data_retention_policies FOR SELECT
USING (true);

-- data_retention_status: System only, but if users need read access:
CREATE POLICY "Users cannot view retention status directly"
ON data_retention_status FOR SELECT
USING (false);
