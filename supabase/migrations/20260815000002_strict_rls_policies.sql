ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_access_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_case_owner(c_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM cases WHERE id = c_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_lawyer_assigned(c_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (SELECT 1 FROM lawyer_assignments WHERE case_id = c_id AND lawyer_id = auth.uid());
$$;

-- cases: User can read/write their own cases.
CREATE POLICY "Users can manage their own cases" ON cases
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- cases: Lawyers can read cases assigned to them.
CREATE POLICY "Lawyers can read assigned cases" ON cases
    FOR SELECT
    TO authenticated
    USING (public.is_lawyer_assigned(id));

-- case_memory: Inherits case visibility
CREATE POLICY "Users can manage their own case memory" ON case_memory
    FOR ALL
    TO authenticated
    USING (public.is_case_owner(case_id))
    WITH CHECK (public.is_case_owner(case_id));

CREATE POLICY "Lawyers can read assigned case memory" ON case_memory
    FOR SELECT
    TO authenticated
    USING (public.is_lawyer_assigned(case_id));

-- lawyer_assignments: Users can read/write assignments for their cases
CREATE POLICY "Users can manage assignments for their cases" ON lawyer_assignments
    FOR ALL
    TO authenticated
    USING (public.is_case_owner(case_id))
    WITH CHECK (public.is_case_owner(case_id));

CREATE POLICY "Lawyers can view their assignments" ON lawyer_assignments
    FOR SELECT
    TO authenticated
    USING (lawyer_id = auth.uid());

-- privacy_access_log: Insert only, view own
CREATE POLICY "Users can insert logs" ON privacy_access_log
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own logs" ON privacy_access_log
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Prevent updates/deletes on logs completely
CREATE POLICY "Logs are immutable for updates" ON privacy_access_log
    FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "Logs are immutable for deletes" ON privacy_access_log
    FOR DELETE
    TO authenticated
    USING (false);
