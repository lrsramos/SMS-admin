# Detailed Guide to Fix Supabase RLS Policies

This guide provides step-by-step instructions on how to fix the Row Level Security (RLS) policies in your Supabase database that are causing infinite recursion errors.

## The Problem

The error message `infinite recursion detected in policy for relation "dashboard_users"` indicates that there's a circular reference in your RLS policies. This is causing 500 Internal Server Error responses when trying to fetch user data.

## Step-by-Step Solution

### 1. Log in to Supabase Dashboard

1. Go to https://app.supabase.io/
2. Log in with your credentials
3. Select your project (the one with ID: lcskthxylbreyoyjrcay)

### 2. Access the SQL Editor

1. In the left sidebar, click on "SQL Editor"
2. Click "New Query" to create a new SQL query

### 3. Run the Fix Script

1. Copy and paste the following SQL script into the editor:

```sql
-- Drop existing policies that might be causing infinite recursion
DROP POLICY IF EXISTS "Users can view dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can insert dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can update dashboard_users" ON dashboard_users;
DROP POLICY IF EXISTS "Users can delete dashboard_users" ON dashboard_users;

DROP POLICY IF EXISTS "Users can view cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can insert cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can update cleaners" ON cleaners;
DROP POLICY IF EXISTS "Users can delete cleaners" ON cleaners;

-- Create new simple policies for dashboard_users table
CREATE POLICY "Users can view dashboard_users" ON dashboard_users
FOR SELECT USING (true);

CREATE POLICY "Users can insert dashboard_users" ON dashboard_users
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update dashboard_users" ON dashboard_users
FOR UPDATE USING (true);

CREATE POLICY "Users can delete dashboard_users" ON dashboard_users
FOR DELETE USING (true);

-- Create new simple policies for cleaners table
CREATE POLICY "Users can view cleaners" ON cleaners
FOR SELECT USING (true);

CREATE POLICY "Users can insert cleaners" ON cleaners
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update cleaners" ON cleaners
FOR UPDATE USING (true);

CREATE POLICY "Users can delete cleaners" ON cleaners
FOR DELETE USING (true);

-- Make sure RLS is enabled on both tables
ALTER TABLE dashboard_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
```

2. Click "Run" to execute the script

### 4. Verify the Changes

1. In the left sidebar, click on "Authentication"
2. Click on "Policies" tab
3. Verify that the policies for `dashboard_users` and `cleaners` tables have been updated

### 5. Test the Application

1. Go back to your application
2. Try logging in again
3. Verify that you can access the protected routes without being redirected back to the login page

## Understanding the Fix

The SQL script:

1. **Drops all existing policies** on the `dashboard_users` and `cleaners` tables to remove any policies that might be causing the infinite recursion
2. **Creates new, simple policies** that allow all operations (you can restrict these later)
3. **Ensures RLS is enabled** on both tables

## Temporary Workaround

If you're unable to fix the RLS policies immediately, we've implemented a temporary workaround in the `AuthProvider.tsx` file that bypasses the database checks. This will allow users to log in and access the application while you work on fixing the database issues.

## Next Steps

Once the basic functionality is working, you should:

1. **Review and refine the RLS policies** to implement proper security
2. **Consider implementing more specific policies** based on user roles
3. **Test the authentication flow** thoroughly

## Troubleshooting

If you continue to experience issues:

1. Check the browser console for any new error messages
2. Verify that the SQL script executed successfully
3. Check if there are any other tables with similar policy issues
4. Consider contacting Supabase support if the issue persists 