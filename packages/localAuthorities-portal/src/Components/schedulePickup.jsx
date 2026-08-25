import React, { useState, useEffect } from "react";
import "./schedule.css";
import { supabase } from "../lib/supabaseClient";
import axios from "axios";

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

function SchedulePickup() {
  const [collectors, setCollectors] = useState([]);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [routes, setRoutes] = useState([]);
  const [route, setRoute] = useState("");
  const [collector, setCollector] = useState("");
  const [councilName, setCouncilName] = useState("");
  const [councilRoutes, setCouncilRoutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetchCollectors();
    fetchRoutes();
  }, []);

  const fetchCollectors = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Council not logged in");

      const councilId = session.user.id;

      const { data, error } = await supabase
        .from("garbagecollector")
        .select("collectorid, fullname")
        .eq("councilno", councilId);

      if (error) throw error;

      setCollectors(data);
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };

  const fetchCouncilName = async () => {
    try {
      const {
        data: { session: councilSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!councilSession) throw new Error("Council not logged in");

      const councilId = councilSession.user.id;

      const { data: councilData, error: councilError } = await supabase
        .from("council")
        .select("councilname")
        .eq("councilid", councilId)
        .single();

      if (councilError) throw councilError;
      setCouncilName(councilData.councilname);

      const { data: routes, error: routeError } = await supabase
        .from("council_routes")
        .select("*")
        .eq("council_id", councilId);

      if (routeError) throw routeError;
      setCouncilRoutes(routes);
    } catch (err) {
      console.error("Error fetching council:", err.message);
      setError(err.message);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data: reports, error } = await supabase
        .from("illegalwastereport")
        .select("*")
        .eq("status", "pending");

      if (error) throw error;

      const filteredReports = await Promise.all(
        reports.map(async (r) => {
          try {
            const lat = parseFloat(r.latitude);
            const lng = parseFloat(r.longitude);

            const matchingRoute = councilRoutes.find((route) => {
              const distance = getDistanceKm(
                lat,
                lng,
                route.center_lat,
                route.center_lng,
              );
              return distance <= route.radius_km;
            });

            if (!matchingRoute) return null;

            const locationName = await getPlaceName(lat, lng);

            return {
              ...r,
              route_name: matchingRoute.route_name,
              locationName,
            };
          } catch (err) {
            console.error(err);
            return null;
          }
        }),
      );

      setLocations(filteredReports.filter(Boolean));
    } catch (err) {
      console.error("Error fetching locations:", err.message);
      setError(err.message);
    }
  };

  const fetchRoutes = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Council not logged in");

      const councilId = session.user.id;

      const { data, error } = await supabase
        .from("council_routes")
        .select("route_name")
        .eq("council_id", councilId);

      if (error) throw error;

      setRoutes(data);
    } catch (err) {
      console.error(err.message);
      setError(err.message);
    }
  };

  const schedulePickup = async (e) => {
    e.preventDefault();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Council not logged in");

      const councilId = session.user.id;

      const selectedCollector = collectors.find(
        (c) => c.collectorid === collector,
      );
      if (!selectedCollector) throw new Error("Collector not found");

      let routeValue = null;
      let selectedLocation = null;

      if (route) {
        const selectedRoute = routes.find((r) => r.route_name === route);

        if (!selectedRoute) {
          throw new Error("Route not found");
        }

        routeValue = selectedRoute.route_name;
      }

      if (location) {
        selectedLocation = locations.find((r) => r.locationName === location);

        if (!selectedLocation) {
          throw new Error("Location not found");
        }
      }

      const { error } = await supabase.from("garbagepickupschedule").insert({
        pickupdate: date,
        route: routeValue,
        location: selectedLocation?.locationName || null,
        location_lat: selectedLocation?.latitude || null,
        location_long: selectedLocation?.longitude || null,
        collectorno: selectedCollector.collectorid,
        councilno: councilId,
      });

      if (error) throw error;

      setDate("");
      setRoute("");
      setCollector("");
      setLocation("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelButton = () => {
    setDate("");
    setRoute("");
    setCollector("");
    setLocation("");
    setError("");
  };

  useEffect(() => {
    fetchCouncilName();
  }, []);

  useEffect(() => {
    if (councilRoutes.length > 0) {
      fetchLocations();
    }
  }, [councilRoutes]);

  return (
    <div className="pickup">
      <h2 className="heading">Schedule Garbage Pickup</h2>

      <form className="scheduleForm ">
        <table>
          <tbody>
            <tr>
              <td>
                <label htmlFor="date">Pickup Date</label>
                <input
                  type="date"
                  placeholder="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </td>
              <td>
                <label htmlFor="location">Location</label>
                <select
                  name="locationName"
                  className="locationName"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.locationName} value={l.locationName}>
                      {l.locationName}
                    </option>
                  ))}
                </select>
              </td>
            </tr>

            <tr>
              <td>
                <label className="route" htmlFor="route">
                  Route
                </label>
                <br></br>
                <select
                  name="routeName"
                  className="routeName"
                  value={route}
                  onChange={(e) => setRoute(e.target.value)}
                >
                  <option value="">Select Route</option>
                  {routes.map((r) => (
                    <option key={r.route_name} value={r.route_name}>
                      {r.route_name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="cName ">
                <label htmlFor="collector" className="collectorName">
                  Garbage Collector
                </label>
                <br></br>
                <select
                  name="collectorName"
                  className="collector"
                  value={collector}
                  onChange={(e) => setCollector(e.target.value)}
                >
                  <option value="">Select Collector</option>
                  {collectors.map((c) => (
                    <option key={c.collectorid} value={c.collectorid}>
                      {c.fullname}
                    </option>
                  ))}
                </select>
              </td>
            </tr>

            <tr>
              <td className="bt1">
                <button type="button" className="btn1" onClick={schedulePickup}>
                  Schedule
                </button>
              </td>
              <td className="bt1">
                <button type="button" className="btn2" onClick={cancelButton}>
                  Cancel
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
}

export default SchedulePickup;
