import { useNavigate } from "react-router-dom";

// Utility function that returns the appropriate path for a role
// but does not perform navigation directly

export const getRedirectPathForRole = (role) => {
  switch (role) {
    case "Member":
      return "/member/dashboard";
    case "Founder":
    case "SuperAdmin":
      return "/founder/dashboard";
    default:
      return "/login";
  }
};

// This can be used inside components with navigate:
// const navigate = useNavigate();
// const redirectPath = getRedirectPathForRole(userRole);
// navigate(redirectPath);
