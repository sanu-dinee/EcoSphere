import { useState } from "react";
import {
  User,
  Mail,
  ChevronLeft,
  ChevronRight,
  Leaf,
  LogOut,
} from "lucide-react";
import "./SideNav.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { useEffect } from "react";

function SideNav({ onNavClick }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const center = JSON.parse(localStorage.getItem("center"));
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [totalBins, setTotalBins] = useState(0);

  const fetchTotalBins = async () => {
    const { count, error } = await supabase
      .from("smartbin")
      .select("*", { count: "exact", head: true })
      .eq("status", "full");
    if (!error) setTotalBins(count);
  };

  useEffect(() => {
    fetchTotalBins();
  }, []);
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className={`side-nav ${isExpanded ? "expanded" : "shrunk"}`}>
      <div className="nav-header">
        <div className="logo-section">
          <Leaf size={28} className="logo-icon" />
          {isExpanded && (
            <span className="logo-text">{center?.centername}</span>
          )}
        </div>
        <button
          className="toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <div className="nav-items">
        <button className="nav-item" onClick={() => onNavClick("profile")}>
          <User size={22} className="nav-icon" />
          {isExpanded && <span className="label">Center Profile</span>}
        </button>

        <button className="nav-item" onClick={() => onNavClick("inbox")}>
          <div className="icon-wrapper">
            <Mail size={22} className="nav-icon" />
            <span className="badge-dot">{totalBins}</span>
          </div>
          {isExpanded && <span className="label">Alerts Inbox</span>}
        </button>
      </div>

      <div className="nav-footer">
        <div className="avatar-section">
          <div className="user-avatar">
            {center?.centername?.charAt(0) ?? "C"}
          </div>

          {isExpanded && (
            <div className="user-info">
              <p className="user-name">{center?.centername}</p>
              <p className="user-status">{center?.location}</p>
            </div>
          )}
        </div>

        {isExpanded && (
          <LogOut
            size={18}
            className="logout-icon"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
          />
        )}
      </div>
    </nav>
  );
}

export default SideNav;
