-- ============================================
-- Supabase RLS Policy Fix for Members Table
-- ============================================
-- Run this SQL in your Supabase SQL Editor to allow inserts
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- Step 1: Drop existing policies if they exist (to recreate them correctly)
DROP POLICY IF EXISTS "Allow public read access" ON members;
DROP POLICY IF EXISTS "Allow anon insert" ON members;
DROP POLICY IF EXISTS "Allow anon update" ON members;
DROP POLICY IF EXISTS "Allow anon delete" ON members;

-- Step 2: Enable RLS on members table (if not already enabled)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policy to allow SELECT for all users
CREATE POLICY "Allow public read access"
ON members
FOR SELECT
TO anon, authenticated
USING (true);

-- Step 4: Create policy to allow INSERT for all users
CREATE POLICY "Allow anon insert"
ON members
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Step 5: Create policy to allow UPDATE for all users
CREATE POLICY "Allow anon update"
ON members
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 6: Create policy to allow DELETE for all users
CREATE POLICY "Allow anon delete"
ON members
FOR DELETE
TO anon, authenticated
USING (true);

-- ============================================
-- Alternative: If you want to temporarily disable RLS for testing
-- (NOT RECOMMENDED FOR PRODUCTION)
-- ============================================
-- ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- ============================================
-- To check existing policies, run:
-- ============================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'members';

-- ============================================
-- To verify policies are working, test with:
-- ============================================
-- This should work after policies are created:
-- INSERT INTO members (first_name, last_name, status) 
-- VALUES ('Test', 'User', 'Active');

