import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cwlajlmxvnjxvkvxqolq.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3bGFqbG14dm5qeHZrdnhxb2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNTczOTcsImV4cCI6MjEwMzkzMzM5N30.T_r__mTjRShboiKvjKSf0LWSNFb_jDehcn2I7GDxvB0'

export const supabase = createClient(supabaseUrl, supabaseKey)