import "./SmartBinAlerts.css";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import axios from "axios";
import MapModal from "./MapModal.jsx";


export const getPlaceName = async (lat, lng) => {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { lat, lon: lng, format: "json" },
    });
    const fullName = res.data.display_name || "Unknown location";
    const parts = fullName.split(",").map((part) => part.trim());
    return parts.slice(0, 3).join(", ");
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return "Unknown location";
  }
};

function SmartBinAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedBinLocation, setSelectedBinLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collectorCouncil, setCollectorCouncil] = useState("");
  const [selectedCollector, setSelectedCollector] = useState({
    collectorid: null,
  });

  const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchOverdueBins = async () => {
    try {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Collector not logged in");

      const collectorId = sessionData.session.user.id;
      setSelectedCollector(collectorId);
      const { data: collectorData, error: collectorError } = await supabase
        .from("garbagecollector")
        .select("councilno")
        .eq("collectorid", collectorId)
        .single();
      if (collectorError) throw collectorError;

      setCollectorCouncil(collectorData.councilno);

      const { data: routes, error: routeError } = await supabase
        .from("council_routes")
        .select("*");

      if (routeError) throw routeError;

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const formattedDate = threeDaysAgo.toISOString().split("T")[0];

      const { data: bins, error: binError } = await supabase
        .from("smartbin")
        .select("*")
        .eq("status", "full")
        .lte("binfulldate", formattedDate);

      if (binError) throw binError;

      const filteredBins = bins.filter((bin) => {
        const lat = parseFloat(bin.latitude);
        const lng = parseFloat(bin.longitude);

        const matchingRoute = routes.find((route) => {
          const distance = getDistanceKm(
            lat,
            lng,
            route.center_lat,
            route.center_lng,
          );
          return (
            distance <= route.radius_km &&
            route.council_id === collectorData.councilno
          );
        });

        return !!matchingRoute;
      });

      const binsWithNames = await Promise.all(
        filteredBins.map(async (bin) => {
          const lat = parseFloat(bin.latitude);
          const lng = parseFloat(bin.longitude);

          const locationName = await getPlaceName(lat, lng);

          return {
            ...bin,
            locationName,
          };
        }),
      );

      setAlerts(binsWithNames);
    } catch (err) {
      console.error("Error fetching alerts:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdueBins();
  }, []);

  const handleUpdateStatus = async (binId) => {
    try {
      const { error } = await supabase.rpc("pickup_smartbin", {
        p_binid: binId,
        p_collectorid: selectedCollector,
      });

      if (error) throw error;

      setAlerts((prev) => prev.filter((bin) => bin.binid !== binId));
    } catch (err) {
      console.error("Transaction failed:", err.message);
    }
  };

  const handleViewBinMap = async (bin) => {
    try {
      const lat = parseFloat(bin.latitude);
      const lng = parseFloat(bin.longitude);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        alert("Location coordinates not available");
        return;
      }

      setSelectedBinLocation({
        lat,
        lng,
        location: bin.locationName || bin.location,
      });
      setMapOpen(true);
    } catch (err) {
      console.error("Error preparing map:", err);
      alert("Could not open map");
    }
  };

  return (
    <div>
      <div className="headerName">Smart Bin Alerts</div>
      <div className="smartbin-pickup">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
              <th>Navigation</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Checking bin statuses...</td>
              </tr>
            ) : alerts.length > 0 ? (
              alerts.map((bin) => (
                <tr key={bin.binid}>
                  <td
                    data-label="Location"
                    className="locationS"
                    style={{ fontWeight: "500" }}
                  >
                    {bin.locationName}
                  </td>

                  <td data-label="Status">
                    <span className="status-pill ">{bin.status}</span>
                  </td>

                  <td data-label="Actions">
                    <button
                      className="btn btn-update"
                      onClick={() => handleUpdateStatus(bin.binid)}
                    >
                      Mark Empty
                    </button>
                  </td>

                  <td data-label="Navigation">
                    <button
                      className="btn btn-map"
                      onClick={() => handleViewBinMap(bin)}
                    >
                      View Map
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No bins are currently overdue for collection
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {mapOpen && (
          <MapModal
            isOpen={mapOpen}
            onClose={() => setMapOpen(false)}
            mode="location"
            selectedLocation={selectedBinLocation}
          />
        )}
      </div>
    </div>
  );
}

export default SmartBinAlerts;
