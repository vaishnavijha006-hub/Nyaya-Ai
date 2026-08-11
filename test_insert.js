import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  // Try to sign in as a test user or see what the error is
  // Or we can just insert anonymously and see the error.
  const { data, error } = await supabase.from('conversations').insert({ title: 'test' }).select();
  console.log("Error:", error);
}
test();
