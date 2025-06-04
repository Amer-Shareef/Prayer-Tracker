import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    // User is not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // User doesn't have the required role
    if (user.role === "Member") {
      return <Navigate to="/member/dashboard" replace />;
    } else if (user.role === "Founder") {
      return <Navigate to="/founder/dashboard" replace />;
    } else if (user.role === "SuperAdmin") {
      return <Navigate to="/superadmin/dashboard" replace />;
    } else {
      // Unknown role, redirect to login
      return <Navigate to="/login" replace />;
    }
  }

  // User is logged in and has the required role
  return children;
};

export default ProtectedRoute;
