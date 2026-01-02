import { Navigate } from "react-router-dom";

export const isAuthenticated = () => {
  return localStorage.getItem("token"); // or any auth flag
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

export default ProtectedRoute;
