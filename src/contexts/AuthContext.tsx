import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'student' | 'admin' | 'vendor' | 'super_user';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  sap_id: string | null;
  room_number: string | null;
  hostel_block: string | null;
  gender: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  isApproved: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  signup: (email: string, password: string, fullName: string, role: UserRole, sapId?: string, roomNumber?: string, hostelBlock?: string, gender?: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isApproved, setIsApproved] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch role and approval status
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, approved')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleData) {
        setRole(roleData.role as UserRole);
        setIsApproved(roleData.approved);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Helper to handle data fetching
    const initializeAuth = async (session: Session | null) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setRole(null);
          setIsApproved(true);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        initializeAuth(session);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If we are already handling an auth change event, this might be redundant, 
      // but safe to call as it just updates state.
      // However, usually onAuthStateChange fires on mount too. 
      // We'll rely primarily on onAuthStateChange, but this ensures we catch the initial state if the listener is late.
      // Actually, onAuthStateChange fires 'INITIAL_SESSION' immediately on subscription if a session exists.
      // So we can often just rely on that. But to be safe and explicit:
      if (!session) {
         // If no session, make sure we stop loading
         setIsLoading(false);
      }
      // If there IS a session, the onAuthStateChange will handle it (or has handled it).
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Check approval status for admin/vendor
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, approved')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (roleData && (roleData.role === 'admin' || roleData.role === 'vendor') && !roleData.approved) {
          // Sign out the user if not approved
          await supabase.auth.signOut();
          return { success: false, error: 'Your account is pending approval by Super User', pendingApproval: true };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    fullName: string, 
    userRole: UserRole,
    sapId?: string,
    roomNumber?: string,
    hostelBlock?: string,
    gender?: string
  ): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    try {
      // Security: Prevent self-assignment of super_user role
      if (userRole === 'super_user') {
        return { success: false, error: 'Invalid role selection. Super user role cannot be self-assigned.' };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            sap_id: sapId || null,
            room_number: roomNumber || null,
            hostel_block: hostelBlock || null,
            gender: gender || null,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return { success: false, error: 'Failed to create profile' };
        }

        // Admin and vendor accounts need approval, students are auto-approved
        const needsApproval = userRole === 'admin' || userRole === 'vendor';
        
        // Create role with approval status
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: userRole,
            approved: !needsApproval, // Students are auto-approved
          });

        if (roleError) {
          console.error('Role creation error:', roleError);
          return { success: false, error: 'Failed to assign role' };
        }

        // If admin/vendor, create approval request and sign out
        if (needsApproval) {
          const { error: approvalError } = await supabase
            .from('approval_requests')
            .insert({
              user_id: data.user.id,
              role: userRole,
              full_name: fullName,
              email: email,
              status: 'pending',
            });

          if (approvalError) {
            console.error('Approval request error:', approvalError);
          }

          // Sign out since they need approval
          await supabase.auth.signOut();
          
          return { 
            success: true, 
            pendingApproval: true 
          };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setIsApproved(true);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      profile,
      role,
      isApproved,
      login, 
      signup,
      logout,
      resetPassword,
      isAuthenticated: !!user,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
