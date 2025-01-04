import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnalyhtalikwsopogula.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYWx5aHRhbGlrd3NvcG9ndWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ0MDY0MDAsImV4cCI6MjAxOTk4MjQwMH0.qwxsHtHtMGHj_mZ5p_iqvEsB8Zy_JZYfFQj2UGirvjg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);