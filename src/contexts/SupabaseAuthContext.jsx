import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (emailOrUsername, password) => {
    let email = emailOrUsername;

    // If input doesn't contain @, it's a username - look up email
    if (!emailOrUsername.includes('@')) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', emailOrUsername)
        .single();

      if (profileError || !profileData) {
        return { 
          data: null, 
          error: { message: 'Username not found. Please check your credentials.' } 
        };
      }

      // Get user email (Note: This requires the email to be stored or accessible)
      // For now, we'll have users sign in with email if username lookup fails
      return { 
        data: null, 
        error: { message: 'Please use your email address to sign in.' } 
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error && error.message !== 'Email not confirmed') {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { data, error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const deleteAccount = useCallback(async () => {
    if (!user) {
      return { error: { message: 'No user logged in' } };
    }

    try {
      // Delete user data from Supabase
      // Note: Deleting from auth.users requires admin privileges
      // We'll delete the profile and related data first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Sign out after deletion
      await signOut();

      return { error: null };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Account Deletion Failed",
        description: error.message || "Something went wrong",
      });
      return { error };
    }
  }, [user, signOut, toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    deleteAccount,
  }), [user, session, loading, signUp, signIn, signOut, deleteAccount]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
