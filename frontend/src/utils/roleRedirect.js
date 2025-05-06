import { useNavigate } from "react-router-dom";

export const roleRedirect = (role) => {
  const navigate = useNavigate();

  switch (role) {
    case "Member":
      navigate("/member/dashboard");
      break;
    case "Founder":
      navigate("/founder/dashboard");
      break;
    case "SuperAdmin":
      navigate("/superadmin/dashboard");
      break;
    default:
      navigate("/login");
  }
};
