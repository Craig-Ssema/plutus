import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    // You can add a loading spinner here
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;