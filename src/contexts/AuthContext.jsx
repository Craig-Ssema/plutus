import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('isAuthenticated') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  const signIn = async (email, password) => {
    toast({
      title: "🚧 Authentication In Progress",
      description: "This is a mock sign-in. Please integrate Supabase to enable full authentication.",
    });
    // Mock successful sign in for UI development
    setIsAuthenticated(true);
    return { error: null };
  };

  const signUp = async (email, password) => {
    toast({
      title: "🚧 Authentication In Progress",
      description: "This is a mock sign-up. Please integrate Supabase to enable full authentication.",
    });
    // Mock successful sign up for UI development
    setIsAuthenticated(true);
    return { error: null };
  };

  const signOut = async () => {
    setIsAuthenticated(false);
  };
  
  const setGuest = () => {
    setIsAuthenticated(false); // Guests are not authenticated
  };

  const value = useMemo(() => ({
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    setGuest,
  }), [isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}