'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://viyssnrvtpoccletcqgy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpeXNzbnJ2dHBvY2NsZXRjcWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjA0NjIsImV4cCI6MjEwMDczNjQ2Mn0.8uZ3j5OMDiaaXrUBgON_j4wiCpREEO6v4KqeY7LUrss';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
