import "./PickupSchedule.css";
import React from "react";
import { supabase } from "../lib/supabaseClient";
import { useState, useEffect } from "react";
import MapModal from "./MapModal.jsx";

export const getPlaceName = async (lat, lng) => {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        lat,
        lon: lng,
        format: "json",
      },
    });
    const fullName = res.data.display_name || "Unknown location";
    const parts = fullName.split(",").map((part) => part.trim());
    const shortName = parts.slice(0, 3).join(", ");

    return shortName;
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return "Unknown location";
  }
};

function PickupSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapMode, setMapMode] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [collectorCouncil, setCollectorCouncil] = useState(null);

  useEffect(() => {
    fetchSchedules();
    loadCollectorCouncil();
  }, []);

  const loadCollectorCouncil = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("garbagecollector")
        .select("councilno")
        .eq("collectorid", session.user.id)
        .single();

      if (error) throw error;
      setCollectorCouncil(data?.councilno);
    } catch (err) {
      console.error("Failed to load council:", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Collector not logged in");

      const collectorId = session.user.id;
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("garbagepickupschedule")
        .select("*")
        .eq("collectorno", collectorId)
        .lt("pickupdate", today)
        .eq("status", "pending");

      if (error) throw error;
      setSchedules(data);
    } catch (err) {
      console.error("Error fetching:", err.message);
      setError(err.message);
    }
  };

  const handleComplete = async (scheduleId) => {
    try {
      const { error } = await supabase
        .from("garbagepickupschedule")
        .update({ status: "completed" })
        .eq("scheduleid", scheduleId);

      if (error) throw error;

      setSchedules((prev) =>
        prev.filter((item) => item.scheduleid !== scheduleId),
      );

      console.error("Status updated to completed!");
    } catch (err) {
      console.err("Update failed: " + err.message);
    }
  };

  useEffect(() => {
    const loadCouncil = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("garbagecollector")
          .select("councilno")
          .eq("collectorid", session.user.id)
          .single();
        if (data) setCollectorCouncil(data.councilno);
      }
    };
    loadCouncil();
  }, []);

  const handleViewMap = async (item) => {
    try {
      const { data: schedule, error: fetchError } = await supabase
        .from("garbagepickupschedule")
        .select("location_lat, location_long, route, location")
        .eq("scheduleid", item.scheduleid)
        .single();

      if (fetchError || !schedule) {
        alert("Could not load schedule details");
        return;
      }

      if (schedule.location_lat != null && schedule.location_long != null) {
        const lat = parseFloat(schedule.location_lat);
        const lng = parseFloat(schedule.location_long);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapMode("location");
          setMapData({
            lat,
            lng,
            location: schedule.location || "Pickup Location",
          });
          setMapOpen(true);
          return;
        }
      }

      if (schedule.route && schedule.route !== "NULL" && collectorCouncil) {
        const { data: routeData, error: routeError } = await supabase
          .from("council_routes")
          .select("center_lat, center_lng, radius_km")
          .eq("route_name", schedule.route)
          .eq("council_id", collectorCouncil)
          .single();

        if (routeError || !routeData) {
          alert("Route details not found");
          return;
        }

        setMapMode("route");
        setMapData({
          center_lat: parseFloat(routeData.center_lat),
          center_lng: parseFloat(routeData.center_lng),
          radius_km: routeData.radius_km || 3,
        });
        setMapOpen(true);
        return;
      }

      alert("No usable location or route data for this schedule");
    } catch (err) {
      console.error("Map prep error:", err);
      alert("Failed to load map");
    }
  };

  return (
    <div>
      <div className="headerName">Garbage Pickup Request</div>

      <div className="citizen-pickup">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Status</th>
              <th>Action</th>
              <th>Navigation</th>
            </tr>
          </thead>

          <tbody>
            {schedules.length > 0 ? (
              schedules.map((item) => (
                <tr key={item.scheduleid}>
                  <td
                    data-label="Location"
                    className="locationS"
                    style={{ fontWeight: "500" }}
                  >
                    {item.route && item.route !== "NULL"
                      ? item.route
                      : item.location}
                  </td>

                  <td data-label="Status">
                    <span className="status-pill">{item.status}</span>
                  </td>

                  <td data-label="Actions">
                    <button
                      className="btn btn-update"
                      onClick={() => handleComplete(item.scheduleid)}
                    >
                      Completed
                    </button>
                  </td>

                  <td data-label="Navigation">
                    <button
                      className="btn btn-map"
                      onClick={() => handleViewMap(item)}
                    >
                      View Map
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No schedules for today
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {mapOpen && (
          <MapModal
            isOpen={mapOpen}
            onClose={() => setMapOpen(false)}
            mode={mapMode}
            selectedRoute={mapMode === "route" ? mapData : null}
            selectedLocation={mapMode === "location" ? mapData : null}
          />
        )}
      </div>
    </div>
  );
}

export default PickupSchedule;
