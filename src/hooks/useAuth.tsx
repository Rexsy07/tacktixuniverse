import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Allowlist fallback via environment for emergency access
  const isEmailAllowlisted = (email?: string | null) => {
    if (!email) return false;
    const fromVite = (import.meta as any)?.env?.VITE_ADMIN_EMAILS as string | undefined;
    const fromWindow = (window as any)?.__ENV?.ADMIN_EMAILS as string | undefined;
    const list = (fromWindow || fromVite || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    return list.includes(email.toLowerCase());
  };

  // Function to check user role from database (with email allowlist fallback)
  const checkUserRole = async (userId: string, email?: string | null) => {
    try {
      // Prefer secure RPC which works even when RLS would block direct selects
      const { data: hasAdmin, error: rpcError } = await supabase.rpc('has_role', { p_role: 'admin' });
      if (!rpcError && typeof hasAdmin === 'boolean') {
        setIsAdmin(hasAdmin || isEmailAllowlisted(email));
        return;
      }

      // Fallback to direct select
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.warn('Role query error:', error);
        setIsAdmin(isEmailAllowlisted(email));
        return;
      }
      
      const adminFromDb = (data?.role as any) === 'admin';
      const adminFromEmail = isEmailAllowlisted(email);
      setIsAdmin(adminFromDb || adminFromEmail);
    } catch (err) {
      console.error('Error checking user role:', err);
      setIsAdmin(isEmailAllowlisted(email));
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check user role from database
        if (session?.user) {
          checkUserRole(session.user.id, session.user.email);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserRole(session.user.id, session.user.email);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime: update admin flag whenever the user's role row changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('user-role-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_roles',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        checkUserRole(user.id, user.email);
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [user?.id]);

  // Also refresh role when tab becomes visible (covers cases where realtime is disabled)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        checkUserRole(user.id, user.email);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [user?.id]);

  // Gentle polling for a short window after login/promotion to catch role changes
  useEffect(() => {
    if (!user?.id) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      if (attempts > 12) { // ~60s at 5s interval
        clearInterval(interval);
        return;
      }
      if (!isAdmin) {
        await checkUserRole(user.id, user.email);
      } else {
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id, isAdmin]);

  // Helper function to get the correct base URL
  const getBaseUrl = () => {
    const isProd = window.location.hostname === 'rexsy07.github.io';
    return isProd 
      ? 'https://Rexsy07.github.io/tacktixuniverse'
      : window.location.origin;
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    const redirectUrl = `${getBaseUrl()}/auth/confirm`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          full_name: fullName
        }
      }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Please check your email to confirm your account');
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
    }

    return { error };
  };

  const signInWithMagicLink = async (email: string) => {
    const redirectUrl = `${getBaseUrl()}/auth/magic-link`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for a magic link!');
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast.success('Signed out successfully');
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}