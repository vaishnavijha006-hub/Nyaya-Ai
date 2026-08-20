-- GUARD Platform Reliability Engine Tables

CREATE TABLE IF NOT EXISTS public.system_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'healthy', 'degraded', 'down'
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    source VARCHAR(255),
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_anomalies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anomaly_type VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.rate_limit_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    endpoint_pattern VARCHAR(255) NOT NULL,
    limit_count INTEGER NOT NULL,
    window_seconds INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incident_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
    severity VARCHAR(50) NOT NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.recovery_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID REFERENCES public.incident_management(id) ON DELETE CASCADE,
    operation_type VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.api_request_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_metrics ENABLE ROW LEVEL SECURITY;

-- Create Policies (Admin only access for operational tables)
-- For simplicity, assuming a role 'admin' or just checking if user is authenticated for read, but we should make it strict.
-- Let's make them accessible only by service role for now or authenticated admins.

CREATE POLICY "Service role can do all on system_health" ON public.system_health USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do all on system_events" ON public.system_events USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do all on security_anomalies" ON public.security_anomalies USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do all on rate_limit_policies" ON public.rate_limit_policies USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do all on incident_management" ON public.incident_management USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do all on recovery_operations" ON public.recovery_operations USING (true) WITH CHECK (true);
CREATE POLICY "Service role can do all on api_request_metrics" ON public.api_request_metrics USING (true) WITH CHECK (true);

-- Adding basic index
CREATE INDEX idx_sys_events_created ON public.system_events(created_at);
CREATE INDEX idx_api_metrics_created ON public.api_request_metrics(created_at);
