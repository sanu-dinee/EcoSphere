import React, { use } from "react";
import "./AdminDashboard.css";
import { supabase } from "../lib/supabaseClient";
import { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBins, setTotalBins] = useState(0);
  const [totalTrees, setTotalTrees] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchAllActivities();
  }, []);

  const fetchStats = async () => {
    setLoadingStats(true);

    try {
      const [{ count: userCount }, { count: binCount }, { data: treeData }] =
        await Promise.all([
          supabase.from("users").select("*", { count: "exact", head: true }),
          supabase.from("smartbin").select("*", { count: "exact", head: true }),
          supabase.from("treestatus").select("treecount"),
        ]);

      const treeSum = treeData?.reduce(
        (sum, row) => sum + (row.treecount || 0),
        0,
      );

      setTotalUsers(userCount || 0);
      setTotalBins(binCount || 0);
      setTotalTrees(treeSum || 0);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };
  const timeAgo = (dateString) => {
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };
  const fetchAllActivities = async () => {
    const combined = [];

    /* ===== AUTH ACTIVITY ===== */
    const { data: authData, error: authError } =
      await supabase.functions.invoke("admin-recent-activity");

    if (!authError && Array.isArray(authData)) {
      authData.forEach((u) => {
        if (u.created_at) {
          combined.push({
            id: `auth-${u.id}`,
            message: `User "${u.email}" registered`,
            created_at: u.created_at,
          });
        }

        if (u.last_sign_in_at) {
          combined.push({
            id: `login-${u.id}`,
            message: `User "${u.email}" logged in`,
            created_at: u.last_sign_in_at,
          });
        }
      });
    }

    /* ===== SMART BIN ACTIVITY ===== */
    const { data: bins, error: binError } = await supabase
      .from("smartbin")
      .select("binid, status, binfulldate")
      .order("binfulldate", { ascending: false })
      .limit(5);

    if (!binError && Array.isArray(bins)) {
      bins.forEach((b) => {
        if (b.binfulldate) {
          combined.push({
            id: `bin-${b.binid}-${b.binfulldate}`,
            message: `Smart Bin #${b.binid} status changed to "${b.status}"`,
            created_at: b.binfulldate,
          });
        }
      });
    }

    /* ===== SORT & LIMIT ===== */
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setActivities(combined.slice(0, 10));
  };

  return (
    <>
      <div className="welcome-card">
        <h2>Welcome to Admin Dashboard</h2>
        <p>You have successfully logged in as an administrator.</p>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>{loadingStats ? "…" : totalUsers}</h3>
            <p>Total Users</p>
          </div>

          <div className="stat-card">
            <h3>{loadingStats ? "…" : totalBins}</h3>
            <p>Active Smart Bins</p>
          </div>

          <div className="stat-card">
            <h3>{loadingStats ? "…" : totalTrees}</h3>
            <p>Total Trees Planted</p>
          </div>

          <div className="stat-card">
            <h3>72</h3>
            <p>Registered Councils</p>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>

        {activities.length === 0 ? (
          <p>No recent activity</p>
        ) : (
          <ul>
            {activities.map((a) => (
              <li key={a.id}>
                <strong>{a.message}</strong>
                <span className="activity-time"> — {a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
