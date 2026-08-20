-- Migration: 20260815000011_legal_prevention.sql
-- Create tables for Legal Prevention & Early Warning Intelligence Engine

-- 1. legal_risk_signals
CREATE TABLE IF NOT EXISTS legal_risk_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'open',
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- 2. preventive_recommendations
CREATE TABLE IF NOT EXISTS preventive_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES legal_risk_signals(id) ON DELETE CASCADE,
    recommendation_text TEXT NOT NULL,
    action_type VARCHAR(255),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. legal_checklists
CREATE TABLE IF NOT EXISTS legal_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    items JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. user_prevention_preferences
CREATE TABLE IF NOT EXISTS user_prevention_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    receive_alerts BOOLEAN DEFAULT TRUE,
    alert_frequency VARCHAR(50) DEFAULT 'immediate',
    custom_settings JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE legal_risk_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prevention_preferences ENABLE ROW LEVEL SECURITY;

-- Strict RLS Policies
CREATE POLICY "Users can view their own legal risk signals" ON legal_risk_signals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own legal risk signals" ON legal_risk_signals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legal risk signals" ON legal_risk_signals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own legal risk signals" ON legal_risk_signals
    FOR DELETE USING (auth.uid() = user_id);


CREATE POLICY "Users can view recommendations for their signals" ON preventive_recommendations
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM legal_risk_signals 
        WHERE legal_risk_signals.id = preventive_recommendations.signal_id AND legal_risk_signals.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert recommendations for their signals" ON preventive_recommendations
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM legal_risk_signals 
        WHERE legal_risk_signals.id = preventive_recommendations.signal_id AND legal_risk_signals.user_id = auth.uid()
    ));

CREATE POLICY "Users can update recommendations for their signals" ON preventive_recommendations
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM legal_risk_signals 
        WHERE legal_risk_signals.id = preventive_recommendations.signal_id AND legal_risk_signals.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete recommendations for their signals" ON preventive_recommendations
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM legal_risk_signals 
        WHERE legal_risk_signals.id = preventive_recommendations.signal_id AND legal_risk_signals.user_id = auth.uid()
    ));


CREATE POLICY "Users can view their own legal checklists" ON legal_checklists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own legal checklists" ON legal_checklists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own legal checklists" ON legal_checklists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own legal checklists" ON legal_checklists
    FOR DELETE USING (auth.uid() = user_id);


CREATE POLICY "Users can view their own prevention preferences" ON user_prevention_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prevention preferences" ON user_prevention_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prevention preferences" ON user_prevention_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prevention preferences" ON user_prevention_preferences
    FOR DELETE USING (auth.uid() = user_id);
