import React, { useState } from "react";
import "./collector.css";
import { useNavigate } from "react-router-dom";
import CitizenPickup from "../Components/PickupSchedule.jsx";
import BinPickup from "../Components/SmartBinAlerts.jsx";
import userIcon from "../assets/images/user (1).png";

function GarbageCollector() {
  const [active, setActive] = useState("citizenPickupBtn");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const gotoProfile = () => navigate("/viewProfile");

  return (
    <div className="gc-container">
     
  <aside className="gc-sidebar">
  <div className={`gc-sidebar-inner ${sidebarOpen ? "show" : ""}`}>
    <ul className="gc-menu">
      <li>
        <button
          className={`gc-btn ${active === "citizenPickupBtn" ? "active" : ""}`}
          onClick={() => {
            setActive("citizenPickupBtn");
            setSidebarOpen(false);
          }}
        >
          Garbage Request
        </button>
      </li>

      <li>
        <button
          className={`gc-btn ${active === "smartBinPickupBtn" ? "active" : ""}`}
          onClick={() => {
            setActive("smartBinPickupBtn");
            setSidebarOpen(false);
          }}
        >
          SmartBin Alert
        </button>
      </li>
    </ul>

    <div className="goProfile" onClick={gotoProfile}>
      <img src={userIcon} alt="user" className="userProfile" />
    </div>
  </div>
</aside>



      
      <main className="gc-main">
        
        <header className="gc-header">
          <button
            className="gc-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
        </header>

     
        <div className="gc-content">
          {active === "citizenPickupBtn" && <CitizenPickup />}
          {active === "smartBinPickupBtn" && <BinPickup />}
        </div>
      </main>
    </div>
  );
}

export default GarbageCollector;
