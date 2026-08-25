import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../pages/AdminDashboard.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="admin-dashboard">
      {/* NAVBAR */}
      <nav className="admin-navbar">
        <div className="nav-left">
          <div className="nav-logo">
            <span>Admin Dashboard</span>
          </div>
        </div>
        <div className="nav-right">
          <div className="user-info">
            <span className="user-greeting">Welcome, {user?.username}</span>
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* SIDEBAR */}
        <div className="sidebar">
          <ul className="sidebar-menu">
            <li className={location.pathname === "/admin" ? "active" : ""}>
              <Link to="/admin">Dashboard</Link>
            </li>
            <li
              className={location.pathname === "/admin/users" ? "active" : ""}
            >
              <Link to="/admin/users">Users</Link>
            </li>
            <li
              className={
                location.pathname === "/admin/smartbins" ? "active" : ""
              }
            >
              <Link to="/admin/smartbins">Smart Bins</Link>
            </li>
            <li
              className={
                location.pathname === "/admin/analytics" ? "active" : ""
              }
            >
              <Link to="/admin/analytics">Council Analytics</Link>
            </li>
            <li
              className={
                location.pathname === "/admin/settings" ? "active" : ""
              }
            >
              <Link to="/admin/settings">Settings</Link>
            </li>
          </ul>
        </div>

        {/* PAGE CONTENT */}
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
