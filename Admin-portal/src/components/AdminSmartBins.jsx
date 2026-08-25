import { useState } from "react";
import SmartBinMap from "../components/SmartBinMap";
import DetailPanel from "../components/DetailPanel";
import AddSmartBinForm from "../components/AddSmartBinForm";
import "./AdminSmartBins.css";

export default function AdminSmartBins() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelContent, setPanelContent] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBinSelect = (payload) => {
    setPanelContent(payload);
    setPanelOpen(true);
  };

  const refreshBins = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="admin-smartbins-page">
      {/* Header */}
      <div className="page-header">
        <h2>SmartBin Configuration</h2>
        <button onClick={() => setShowAddForm(true)}>+ Add New Bin</button>
      </div>

      {/* Map */}
      <div className="map-wrapper">
        <SmartBinMap onBinSelect={handleBinSelect} refreshKey={refreshKey} />
      </div>

      {/* Right Floating Panel */}
      <DetailPanel
        isOpen={panelOpen}
        content={panelContent}
        onClose={() => setPanelOpen(false)}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />

      {/* Add Bin Modal */}
      {showAddForm && (
        <AddSmartBinForm
          onClose={() => setShowAddForm(false)}
          onAdded={refreshBins}
        />
      )}
    </div>
  );
}
