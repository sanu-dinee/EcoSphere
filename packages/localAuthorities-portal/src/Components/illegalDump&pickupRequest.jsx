import React, { useState, useEffect } from "react";
import "./illegalDumping.css";
import "bootstrap/dist/css/bootstrap.min.css";
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

const assignRoute = (pickup, routes) => {
  let nearestRoute = "Unassigned";
  let minDistance = Infinity;

  routes.forEach((r) => {
    const distance = getDistanceKm(
      parseFloat(pickup.latitude),
      parseFloat(pickup.longitude),
      parseFloat(r.center_lat),
      parseFloat(r.center_lng),
    );
    if (distance <= r.radius_km && distance < minDistance) {
      nearestRoute = r.route_name;
      minDistance = distance;
    }
  });

  return nearestRoute;
};

function IllegalReport() {
  const [active, setActive] = useState("b1");
  const [option, setOption] = useState("");
  const [option1, setOption1] = useState("");
  const [pickupRequests, setPickupRequests] = useState([]);
  const [illegalReports, setIllegalReports] = useState([]);
  const [councilName, setCouncilName] = useState("");
  const [councilRoutes, setCouncilRoutes] = useState([]);
  const [error, setError] = useState("");

  const statusColor = (status) => {
    if (status === "completed") return "green";
    if (status === "in-progress") return "blue";
    if (status === "rejected") return "red";
    return "rgba(119, 119, 52, 1)";
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

  const fetchPickupRequests = async () => {
    try {
      const { data: requests, error: reqError } = await supabase
        .from("garbagepickuprequest")
        .select("*");

      if (reqError) throw reqError;

      const filteredRequests = await Promise.all(
        requests.map(async (r) => {
          try {
            const { data: citizen, error: citizenError } = await supabase
              .from("citizen")
              .select("nearestcouncil")
              .eq("citizenid", r.citizenno)
              .single();

            if (citizenError) throw citizenError;

            const routeName = assignRoute(r, councilRoutes);

            return {
              ...r,
              status:
                r.status === "Requested" ? "pending" : r.status.toLowerCase(),
              nearestcouncil: citizen.nearestcouncil,
              route_name: routeName,
            };
          } catch (citErr) {
            setError("Error fetching citizen:", citErr.message);
            return null;
          }
        }),
      );

      setPickupRequests(
        filteredRequests.filter((r) => r && r.nearestcouncil === councilName),
      );
    } catch (err) {
      setError("Pickup fetch error:", err.message);
      setError(err.message);
    }
  };

  const fetchIllegalReports = async () => {
    try {
      const { data: reports, error: reportError } = await supabase
        .from("illegalwastereport")
        .select("*")
        .eq("status", "pending");

      if (reportError) throw reportError;

      const filteredReports = await Promise.all(
        reports.map(async (r) => {
          try {
            const lat = parseFloat(r.latitude);
            const lng = parseFloat(r.longitude);

            const matchingRoute = councilRoutes.find(
              (route) =>
                getDistanceKm(lat, lng, route.center_lat, route.center_lng) <=
                route.radius_km,
            );

            if (!matchingRoute) return null;

            const locationName = await getPlaceName(lat, lng);

            return {
              ...r,
              status: r.status.toLowerCase(),
              council_id: matchingRoute.council_id,
              route_name: matchingRoute.route_name,
              locationName,
            };
          } catch (err) {
            console.error("Error processing illegal report:", err);
            return null;
          }
        }),
      );

      setIllegalReports(
        filteredReports.filter(
          (r) => r && r.council_id === councilRoutes[0].council_id,
        ),
      );
    } catch (err) {
      setError("Illegal report fetch error: " + err.message);
    }
  };

  const updatePickupStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from("garbagepickuprequest")
        .update({ status })
        .eq("requestid", id);

      if (error) throw error;

      if (status === "in-progress") {
        setPickupRequests((prev) => prev.filter((r) => r.requestid !== id));
      } else {
        fetchPickupRequests();
      }
    } catch (err) {
      console.error("Update pickup status error:", err.message);
      setError(err.message);
    }
  };

  const updateIllegalStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from("illegalwastereport")
        .update({ status })
        .eq("reportid", id);

      if (error) throw error;

      if (status === "rejected" || status === "in-progress") {
        setIllegalReports((prev) => prev.filter((r) => r.reportid !== id));
      } else {
        fetchIllegalReports();
      }
    } catch (err) {
      console.error("Update illegal status error:", err.message);
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchCouncilName();
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (councilName && councilRoutes.length > 0) {
      fetchPickupRequests();
      fetchIllegalReports();
    }
  }, [councilName, councilRoutes]);

  return (
    <div className="illegalTable">
      <div className="container">
        <div className="row firstRow">
          <div className="col-md-6">
            <button
              className="b1"
              style={{
                backgroundColor:
                  active === "b1" ? "var(--color-three)" : "var(--color-one)",
                color:
                  active === "b1" ? "var(--color-one)" : "var(--color-three)",
              }}
              onClick={() => setActive("b1")}
            >
              Garbage Pickup Request
            </button>
          </div>
          <div className="col-md-6">
            <button
              className="b2"
              style={{
                backgroundColor:
                  active === "b2" ? "var(--color-three)" : "var(--color-one)",
                color:
                  active === "b2" ? "var(--color-one)" : "var(--color-three)",
              }}
              onClick={() => setActive("b2")}
            >
              Illegal Dump Report
            </button>
          </div>
        </div>

        {active === "b1" && (
          <div className="scroll-table-container">
            <table className="table table-bordered mt-3">
              <thead className="sticky-top">
                <tr>
                  <th className="col">Date</th>
                  <th className="col">Route</th>
                  <th className="col">Status</th>
                  <th className="col">Update Status</th>
                </tr>
              </thead>
              <tbody className="body">
                {pickupRequests
                  .filter((r) => option === "" || r.status === option)
                  .map((r) => (
                    <tr key={r.requestid}>
                      <td>{r.requestdate}</td>
                      <td>{r.route_name}</td>
                      <td>
                        <button
                          className="p"
                          style={{ backgroundColor: statusColor(r.status) }}
                        >
                          {r.status}
                        </button>
                      </td>
                      <td>
                        <label>
                          <input
                            type="radio"
                            checked={r.status === "in-progress"}
                            disabled={r.status === "in-progress"}
                            onChange={() =>
                              updatePickupStatus(r.requestid, "in-progress")
                            }
                          />{" "}
                          In-progress
                        </label>
                        <br />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {active === "b2" && (
          <div className="scroll-table-container">
            <table className="thirdRow scroll-table table table-bordered mt-3">
              <thead className="sticky-top">
                <tr>
                  <th>Date</th>
                  <th>Location</th>
                  <th className="desc">Description</th>
                  <th>Evidence</th>
                  <th className="statusBtn">Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {illegalReports
                  .filter((r) => option1 === "" || r.status === option1)
                  .map((r) => (
                    <tr key={r.reportid}>
                      <td>{r.datereport}</td>
                      <td>{r.locationName}</td>

                      <td className="description">{r.description}</td>
                      <td>
                        <img
                          src={r.imageurl}
                          alt="evidence"
                          className="evidence"
                        />
                      </td>
                      <td>
                        <button
                          className="p1"
                          style={{ backgroundColor: statusColor(r.status) }}
                        >
                          {r.status}
                        </button>
                      </td>
                      <td>
                        <label>
                          <input
                            type="radio"
                            checked={r.status === "in-progress"}
                            disabled={r.status === "in-progress"}
                            onChange={() =>
                              updateIllegalStatus(r.reportid, "in-progress")
                            }
                          />{" "}
                          In-progress
                        </label>
                        <br />
                        <label>
                          <input
                            type="radio"
                            checked={r.status === "rejected"}
                            disabled={r.status === "rejected"}
                            onChange={() =>
                              updateIllegalStatus(r.reportid, "rejected")
                            }
                          />{" "}
                          Reject
                        </label>
                        <br />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default IllegalReport;
