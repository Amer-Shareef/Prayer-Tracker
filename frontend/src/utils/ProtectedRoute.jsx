import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role, roles }) => {
  const { user, loading } = useAuth();

  // Show loading state or spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check role - Support both single role and multiple roles
  if (role || roles) {
    const allowedRoles = roles || [role];
    
    // Special handling for WCM: treat as Member in frontend
    const userRoleForUI = user.role === "WCM" ? "Member" : user.role;
    
    if (!allowedRoles.includes(userRoleForUI)) {
      // Redirect to appropriate dashboard based on user's actual role
      if (userRoleForUI === "Member") {
        return <Navigate to="/member/dashboard" replace />;
      } else if (userRoleForUI === "Founder" || user.role === "SuperAdmin") {
        return <Navigate to="/founder/dashboard" replace />;
      } else {
        return <Navigate to="/login" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;