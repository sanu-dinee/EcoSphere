import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

// Role → Dashboard mapping
const dashboardByRole = {
  3: "/council",
  4: "/center-dashboard",
  5: "/store-dashboard",
  6: "/collector-dashboard",
};

function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // 🔹 Get session user (persisted by Supabase)
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        setUserType(null);
        setLoading(false);
        return;
      }

      // 🔹 Get user role
      const { data: userData, error } = await supabase
        .from("users")
        .select("usertype")
        .eq("id", authData.user.id)
        .single();

      if (!error) {
        setUserType(userData.usertype);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return null;

  // ❌ Not logged in
  if (!userType) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Logged in but wrong dashboard → redirect to correct one
  if (!allowedRoles.includes(userType)) {
    const correctDashboard = dashboardByRole[userType];
    return <Navigate to={correctDashboard || "/login"} replace />;
  }

  // ✅ Authorized
  return children;
}

export default ProtectedRoute;
