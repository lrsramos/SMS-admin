# Implementing Proper RLS Policies for Your Application

This guide provides instructions on how to implement proper Row Level Security (RLS) policies for your application with two user roles: admin and cleaner.

## User Roles and Permissions

Your application has two user roles:

1. **Admin**: Can create, edit, manage, delete, and see everything
2. **Cleaner**: Can see their own profile and clients and appointments designed for their names

## Step-by-Step Implementation

### 1. Log in to Supabase Dashboard

1. Go to https://app.supabase.io/
2. Log in with your credentials
3. Select your project (the one with ID: lcskthxylbreyoyjrcay)

### 2. Access the SQL Editor

1. In the left sidebar, click on "SQL Editor"
2. Click "New Query" to create a new SQL query

### 3. Run the Proper RLS Policies Script

1. Copy and paste the contents of the `proper_rls_policies.sql` file
2. Click "Run" to execute the script

### 4. Verify the Changes

1. In the left sidebar, click on "Authentication"
2. Click on "Policies" tab
3. Verify that the policies for all tables have been updated

### 5. Update the AuthProvider.tsx

1. Make sure the `USE_TEMPORARY_BYPASS` flag in `AuthProvider.tsx` is set to `false`
2. This will enable the proper authentication flow that checks user roles in the database

### 6. Test the Application

1. Log in as an admin user
2. Verify that you can access all features
3. Log in as a cleaner user
4. Verify that you can only access your own profile, clients, and appointments

## Understanding the RLS Policies

The RLS policies implement the following permissions:

### For dashboard_users table:
- **Admins**: Can perform all operations (SELECT, INSERT, UPDATE, DELETE)
- **Cleaners**: Can only view and update their own profile

### For cleaners table:
- **Admins**: Can perform all operations (SELECT, INSERT, UPDATE, DELETE)
- **Cleaners**: Can only view and update their own profile

### For appointments table:
- **Admins**: Can perform all operations (SELECT, INSERT, UPDATE, DELETE)
- **Cleaners**: Can only view appointments assigned to them

### For clients table:
- **Admins**: Can perform all operations (SELECT, INSERT, UPDATE, DELETE)
- **Cleaners**: Can only view clients they have appointments with

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that the SQL script executed successfully
3. Make sure the `USE_TEMPORARY_BYPASS` flag is set to `false`
4. Check if there are any other tables that need RLS policies

## Next Steps

Once the basic functionality is working, you should:

1. **Test thoroughly** with both admin and cleaner users
2. **Refine the UI** to show/hide elements based on user role
3. **Add additional security measures** like input validation and sanitization 