import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface Props {
  children: JSX.Element;
  role?: "admin" | "hr" | "employee" | "trainer";
}



export default function ProtectedRoute({ children, role }: Props) {
  const { user, isAuthenticated } = useAuthStore();

  // Wait until store loads
  if (isAuthenticated === false && !user) {
    return <Navigate to="/" replace />;
  }
  console.log("AUTH CHECK →", {
    isAuthenticated,
    user
  });


  // Normalize role check
  if (role && user?.role?.toLowerCase() !== role.toLowerCase()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
