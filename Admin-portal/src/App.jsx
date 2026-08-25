// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginComponent from "./components/LoginComponent";
import { AuthProvider, useAuth } from "./context/AuthContext";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminSmartBins from "./components/AdminSmartBins";
import AdminCouncilAnalytics from "./components/evaluation";
import "./App.css";

/* 🔐 Protected Route */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/* 🌐 Public Route */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginComponent />
              </PublicRoute>
            }
          />

          {/* Admin (Protected + Layout) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="smartbins" element={<AdminSmartBins />} />
            <Route path="analytics" element={<AdminCouncilAnalytics />} />
          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
