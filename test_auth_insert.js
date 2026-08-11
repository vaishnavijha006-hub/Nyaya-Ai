import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// using the service role key to insert a user or bypassing RLS is an option, 
// but we just want to see the error. We can't authenticate without a real user.
