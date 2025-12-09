import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://olvccgaogqfzcdxkqtwx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdmNjZ2FvZ3FmemNkeGtxdHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzg0NjksImV4cCI6MjA4MDg1NDQ2OX0.7tg3SFdHrz7bWxLRk6rrQPAyOrtfelRXSRRlxcwqE1Y'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

