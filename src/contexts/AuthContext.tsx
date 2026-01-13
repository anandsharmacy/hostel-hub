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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  isApproved: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  signup: (email: string, password: string, fullName: string, role: UserRole, sapId?: string, roomNumber?: string, hostelBlock?: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  logout: () => Promise<void>;
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setIsApproved(true);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
    hostelBlock?: string
  ): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    try {
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
