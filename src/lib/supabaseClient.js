import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vwfebdrcpqjzflqkmwlt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZmViZHJjcHFqemZscWttd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMzUwNzksImV4cCI6MjA5MTYxMTA3OX0.6dwFEubNM2dnOUUQgCmYvFfZJ2vjw9uUibMlG3nlG34'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
