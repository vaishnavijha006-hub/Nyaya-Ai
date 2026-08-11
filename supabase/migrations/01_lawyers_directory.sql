-- Create the lawyers table

CREATE TABLE IF NOT EXISTS public.lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT NOT NULL,
    location TEXT NOT NULL,
    rating NUMERIC(2, 1) NOT NULL,
    bio TEXT NOT NULL,
    experience_years INTEGER NOT NULL,
    verified BOOLEAN DEFAULT false,
    specialties TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read the lawyers directory
CREATE POLICY "Anyone can view lawyers" ON public.lawyers
    FOR SELECT USING (true);

-- Insert Mock Data
INSERT INTO public.lawyers (name, avatar_url, location, rating, bio, experience_years, verified, specialties) VALUES
('Adv. Vikram Sharma', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop', 'Delhi', 4.9, 'Senior advocate specializing in constitutional and corporate law at the Delhi High Court.', 15, true, ARRAY['Constitutional Law', 'Corporate Law']),
('Adv. Priya Patel', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop', 'Mumbai', 4.8, 'Expert in family law and dispute resolution. Dedicated to providing compassionate legal support.', 8, true, ARRAY['Family Law', 'Civil Litigation']),
('Adv. Rohan Desai', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', 'Bangalore', 4.7, 'Tech-focused lawyer handling intellectual property and startup advisory.', 12, true, ARRAY['Intellectual Property', 'Corporate Law']),
('Adv. Anita Reddy', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop', 'Hyderabad', 4.9, 'Leading criminal defense lawyer with a track record of high-profile acquittals.', 20, true, ARRAY['Criminal Law', 'Cyber Law']),
('Adv. Sanjay Gupta', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', 'Chennai', 4.6, 'Property and real estate legal expert handling major disputes and title verifications.', 10, false, ARRAY['Property Law', 'Civil Litigation'])
ON CONFLICT DO NOTHING;
