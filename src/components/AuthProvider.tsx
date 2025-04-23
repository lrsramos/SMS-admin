import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../types';

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  userId: string | null;
}

export const AuthContext = React.createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userRole: null,
  userId: null,
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [userRole, setUserRole] = React.useState<UserRole | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [errorCount, setErrorCount] = React.useState(0);

  // Set this to true to use the temporary bypass
  const USE_TEMPORARY_BYPASS = false;

  const handleSession = async (email: string | undefined) => {
    if (!email) {
      setUserRole(null);
      setUserId(null);
      setIsAuthenticated(false);
      return;
    }

    // TEMPORARY BYPASS: Set default role and authentication
    if (USE_TEMPORARY_BYPASS) {
      setUserRole('admin' as UserRole);
      setUserId('temp-user-id');
      setIsAuthenticated(true);
      setErrorCount(0);
      console.log('Using temporary authentication bypass for:', email);
      return;
    }

    try {
      // First check dashboard_users table
      const { data: dashboardUser, error: dashboardError } = await supabase
        .from('dashboard_users')
        .select('id, role, active')
        .eq('email', email)
        .single();

      if (dashboardError) {
        console.error('Error fetching dashboard user:', dashboardError);
        // Don't throw error, just continue to check cleaners
      }

      if (dashboardUser?.active && dashboardUser?.role) {
        setUserRole(dashboardUser.role as UserRole);
        setUserId(dashboardUser.id);
        setIsAuthenticated(true);
        setErrorCount(0); // Reset error count on success
        return;
      }

      // Then check cleaners table
      const { data: cleaner, error: cleanerError } = await supabase
        .from('cleaners')
        .select('id, role, active')
        .eq('email', email)
        .single();

      if (cleanerError) {
        console.error('Error fetching cleaner:', cleanerError);
        // Don't throw error, just continue
      }

      if (cleaner?.active && cleaner?.role) {
        setUserRole(cleaner.role as UserRole);
        setUserId(cleaner.id);
        setIsAuthenticated(true);
        setErrorCount(0); // Reset error count on success
        return;
      }

      // If no valid role found, set unauthenticated but don't force redirect
      setIsAuthenticated(false);
      setUserRole(null);
      setUserId(null);
      
      // Increment error count
      setErrorCount(prev => prev + 1);
      
      // If we've had too many errors, sign out to prevent infinite loops
      if (errorCount > 5) {
        console.error('Too many authentication errors, signing out');
        await supabase.auth.signOut();
        setErrorCount(0);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
      setUserId(null);
      setIsAuthenticated(false);
      
      // Increment error count
      setErrorCount(prev => prev + 1);
      
      // If we've had too many errors, sign out to prevent infinite loops
      if (errorCount > 5) {
        console.error('Too many authentication errors, signing out');
        await supabase.auth.signOut();
        setErrorCount(0);
      }
    }
  };

  React.useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        handleSession(session.user.email);
      } else {
        setUserRole(null);
        setUserId(null);
        // Only navigate to login if we're not already there
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
      
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      
      if (session?.user) {
        handleSession(session.user.email);
      } else {
        setUserRole(null);
        setUserId(null);
        // Only navigate to login if we're not already there
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userRole, userId }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};