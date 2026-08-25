import React from "react";
import SmartMap from "./smartMap.jsx";
import { supabase } from "../lib/supabaseClient";
const MapModal = ({
  isOpen,
  onClose,
  mode,
  selectedRoute,
  selectedLocation,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "95%",
          height: "90%",
          backgroundColor: "white",
          borderRadius: "8px",
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <SmartMap
          mode={mode}
          selectedRoute={selectedRoute}
          selectedLocation={selectedLocation}
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export default MapModal;
