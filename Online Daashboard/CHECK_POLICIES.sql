-- ============================================
-- Check Current RLS Policies for Members Table
-- ============================================
-- Run this to see what policies currently exist

-- Check all policies on members table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'members'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'members';

-- Check table owner and schema
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'members';

