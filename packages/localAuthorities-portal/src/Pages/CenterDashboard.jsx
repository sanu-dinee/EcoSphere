import { useEffect, useState } from "react";
import { Leaf, Activity, MapPin } from "lucide-react";
import SmartBinMap from "../Components/SmartBinMap.jsx";
import SideNav from "../Components/SideNav.jsx";
import DetailPanel from "../Components/DetailPanel.jsx";
import "./CenterDashboard.css";
import { supabase } from "../lib/supabaseClient.js";

function CenterDashboard() {
  const [rightPanelContent, setRightPanelContent] = useState(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [totalBins, setTotalBins] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const openRightPanel = (data) => {
    setRightPanelContent(data);
    setIsRightPanelOpen(true);
  };
  const fetchTotalBins = async () => {
    const { count, error } = await supabase
      .from("smartbin")
      .select("*", { count: "exact", head: true });
    if (!error) setTotalBins(count);
  };

  useEffect(() => {
    fetchTotalBins();
  }, []);

  return (
    <div className="dashboard-container">
      {/* HEADER: Placed at the top level */}
      <header className="main-dashboard-header">
        <div className="header-left">
          <div className="logo-box">
            <Leaf size={32} className="header-logo-icon" />
          </div>
          <div className="title-stack">
            <h1>RECYCLE CENTER DASHBOARD</h1>
            <div className="subtitle">
              <Activity size={14} />
              <span>Real-time Waste Management System</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="system-status">
            <span className="status-indicator online"></span>
            System Online
          </div>
          <div className="header-stat-pill">
            <MapPin size={16} />
            <span>{totalBins} Bins Active</span>
          </div>
        </div>
      </header>

      {/* VIEWPORT: This holds the floating UI and the Map */}
      <div className="dashboard-viewport">
        {/* Navigation Layer */}
        <SideNav onNavClick={(type) => openRightPanel({ type })} />

        {/* Map Layer */}
        <div className="map-layer">
          <SmartBinMap onBinSelect={openRightPanel} refreshKey={refreshKey} />
        </div>

        {/* Detail Layer */}
        <DetailPanel
          isOpen={isRightPanelOpen}
          content={rightPanelContent}
          onClose={() => setIsRightPanelOpen(false)}
          onDispatchSuccess={() => setRefreshKey((k) => k + 1)}
        />
      </div>
    </div>
  );
}

export default CenterDashboard;
