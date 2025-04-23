# Fixing RLS Policies in Supabase

This document provides instructions on how to fix the Row Level Security (RLS) policies in your Supabase database that are causing infinite recursion errors.

## The Problem

The error message `infinite recursion detected in policy for relation "dashboard_users"` indicates that there's a circular reference in your RLS policies. This is causing 500 Internal Server Error responses when trying to fetch user data.

## Solution

1. Log in to your Supabase dashboard at https://app.supabase.io/
2. Select your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Copy and paste the contents of the `fix_rls_policies.sql` file
6. Run the query

## What the Fix Does

The SQL script:

1. Drops all existing policies on the `dashboard_users` and `cleaners` tables
2. Creates new, simple policies that allow all operations (you can restrict these later)
3. Ensures RLS is enabled on both tables

## After Applying the Fix

After applying the fix:

1. The infinite recursion error should be resolved
2. Your authentication flow should work correctly
3. Users should be able to log in without being redirected back to the login page

## Next Steps

Once the basic functionality is working, you should:

1. Review and refine the RLS policies to implement proper security
2. Consider implementing more specific policies based on user roles
3. Test the authentication flow thoroughly

## Troubleshooting

If you continue to experience issues:

1. Check the browser console for any new error messages
2. Verify that the SQL script executed successfully
3. Check if there are any other tables with similar policy issues 