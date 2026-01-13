import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'student' | 'admin' | 'vendor';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roomNumber?: string;
  hostelBlock?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<UserRole, User> = {
  student: {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@nmims.edu',
    role: 'student',
    roomNumber: '304',
    hostelBlock: 'Block A',
  },
  admin: {
    id: '2',
    name: 'Admin User',
    email: 'admin@nmims.edu',
    role: 'admin',
  },
  vendor: {
    id: '3',
    name: 'Store Manager',
    email: 'vendor@nmims.edu',
    role: 'vendor',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Mock authentication - in production, this would call an API
    if (email && password) {
      setUser(mockUsers[role]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
