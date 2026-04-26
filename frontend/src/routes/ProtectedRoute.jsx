import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

const ProtectedRoute = ({ children, rolesAllowed }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (rolesAllowed && !rolesAllowed.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
