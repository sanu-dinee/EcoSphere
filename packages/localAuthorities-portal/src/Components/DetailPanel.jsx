import { X, User, Bell, Trash2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./DetailPanel.css";

function DetailPanel({ isOpen, content, onClose, onDispatchSuccess }) {
  const [fullBins, setFullBins] = useState([]);
  const [center, setCenter] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pickupHistory, setPickupHistory] = useState([]);

  // Profile editing state — always at top level
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    centername: "",
    location: "",
    email: "",
    contactnumber: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });

  // Load center from localStorage and initialize form
  useEffect(() => {
    const storedCenter = localStorage.getItem("center");
    if (storedCenter) {
      const parsed = JSON.parse(storedCenter);
      setCenter(parsed);
      setFormData({
        centername: parsed.centername || "",
        location: parsed.location || "",
        email: parsed.email || "",
        contactnumber: parsed.contactnumber || "",
      });
    }
  }, []);

  // Fetch full bins for inbox
  useEffect(() => {
    if (content?.type === "inbox") {
      fetchFullBins();
    }
  }, [content]);

  const fetchFullBins = async () => {
    const { data, error } = await supabase
      .from("smartbin")
      .select("binid, location, wastetype")
      .eq("status", "full");

    if (!error && data) {
      setFullBins(data);
    }
  };

  const handleConfirmDispatch = async (binid) => {
    const confirmed = window.confirm(
      "Are you sure you want to confirm dispatch? This will mark the bin as empty.",
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("smartbin")
      .update({ status: "empty" })
      .eq("binid", binid);

    if (error) {
      alert("Failed to update bin status");
      console.error(error);
    } else {
      alert("Bin marked as empty successfully");
      setFullBins((prev) => prev.filter((bin) => bin.binid !== binid));
      onDispatchSuccess();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ text: "", type: "" });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Update recyclecenter table
      const { error: centerError } = await supabase
        .from("recyclecenter")
        .update({
          centername: formData.centername.trim(),
          location: formData.location.trim(),
        })
        .eq("centerid", user.id);

      if (centerError) throw centerError;

      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          email: formData.email.trim(),
          contactnumber: formData.contactnumber.trim(),
        })
        .eq("id", user.id);

      if (userError) throw userError;

      // Update state and localStorage
      const updatedCenter = {
        ...center,
        centername: formData.centername.trim(),
        location: formData.location.trim(),
        email: formData.email.trim(),
        contactnumber: formData.contactnumber.trim(),
      };

      setCenter(updatedCenter);
      localStorage.setItem("center", JSON.stringify(updatedCenter));

      setProfileMessage({
        text: "Profile updated successfully!",
        type: "success",
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update failed:", err);
      setProfileMessage({
        text: err.message || "Failed to update profile.",
        type: "error",
      });
    } finally {
      setProfileLoading(false);
    }
  };
  const fetchCollectionHistory = async (binid) => {
    setHistoryLoading(true);

    const { data, error } = await supabase
      .from("smartbinpickup")
      .select(
        `
      binscheduleid,
      pickupdate,
      users!smartbinpickup_collectorno_fkey (
        id,
        username,
        email
      ),
      recyclecenter:users!smartbinpickup_recyclecenterno_fkey (
        id,
        username,
        email
      )
    `,
      )
      .eq("smartbinno", binid)
      .order("pickupdate", { ascending: false });

    if (error) {
      console.error("Failed to load collection history", error);
    } else {
      setPickupHistory(data);
    }

    setHistoryLoading(false);
  };

  const renderContent = () => {
    /* ================= PROFILE ================= */
    if (content?.type === "profile") {
      return (
        <div className="panel-inner">
          <div className="static-info-card">
            <p>
              <strong>Center Name:</strong> {center?.centername || "N/A"}
            </p>
            <p>
              <strong>Location:</strong> {center?.location || "N/A"}
            </p>
          </div>

          {/* Edit Button — outside the form to prevent submission */}
          {!isEditing && (
            <div className="profile-actions">
              <button
                type="button"
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Editable Form */}
          <form className="profile-form" onSubmit={handleUpdateProfile}>
            <div className="input-field">
              <label>Center Name</label>
              <input
                type="text"
                name="centername"
                value={formData.centername}
                onChange={handleInputChange}
                disabled={!isEditing || profileLoading}
                required
              />
            </div>

            <div className="input-field">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={!isEditing || profileLoading}
                required
              />
            </div>

            <div className="input-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing || profileLoading}
                required
              />
            </div>

            <div className="input-field">
              <label>Contact Number</label>
              <input
                type="text"
                name="contactnumber"
                value={formData.contactnumber}
                onChange={handleInputChange}
                disabled={!isEditing || profileLoading}
                required
              />
            </div>

            {/* Message */}
            {profileMessage.text && (
              <div className={`message ${profileMessage.type}`}>
                {profileMessage.text}
              </div>
            )}

            {/* Save & Cancel — only during editing */}
            {isEditing && (
              <div className="profile-actions">
                <button
                  type="submit"
                  className="save-btn"
                  disabled={profileLoading}
                >
                  <Save size={18} />
                  {profileLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      centername: center?.centername || "",
                      location: center?.location || "",
                      email: center?.email || "",
                      contactnumber: center?.contactnumber || "",
                    });
                    setProfileMessage({ text: "", type: "" });
                  }}
                  disabled={profileLoading}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      );
    }

    /* ================= INBOX ================= */
    if (content?.type === "inbox") {
      return (
        <div className="panel-inner">
          <h4 className="inbox-subtitle">Critical Alerts (100% Full)</h4>

          {fullBins.length === 0 && (
            <p className="empty-state">No critical bins 🎉</p>
          )}

          {fullBins.map((bin) => (
            <div key={bin.binid} className="alert-card">
              <div className="alert-header">
                <span className="urgent-tag">FULL</span>
                <span className="bin-id">BIN-{bin.binid}</span>
              </div>
              <h5>{bin.location}</h5>
              <p>Type: {bin.wastetype}</p>
              <button
                className="dispatch-btn"
                onClick={() => handleConfirmDispatch(bin.binid)}
              >
                Confirm Dispatch
              </button>
            </div>
          ))}
        </div>
      );
    }

    /* ================= BIN DETAILS ================= */
    if (content?.type === "bin" && content.data) {
      const bin = content.data;
      const statusText = bin.status?.toLowerCase() ?? "unknown";
      const STATUS_MAP = { full: 100, "half full": 50, empty: 1 };
      const fill = STATUS_MAP[statusText] ?? 0;
      const statusClass = statusText.replace(/\s/g, "");

      return (
        <div className="panel-inner">
          <div className="smartbin-card">
            <div className="smartbin-header">
              <div>
                <h4>{bin.location}</h4>
                <span className={`status-pill ${statusClass}`}>
                  {bin.status || "Unknown"}
                </span>
              </div>
              <div className="bin-id">BIN-{bin.binid}</div>
            </div>

            <div className="smartbin-progress">
              <div className="progress-bar" style={{ "--fill": `${fill}%` }} />
              <div className="progress-label">{fill}% Capacity Used</div>
            </div>

            <div className="smartbin-info">
              <div className="info-box">
                <label>Waste Type:</label>
                <span>{bin.wastetype}</span>
              </div>
              <div className="info-box">
                <label>Total Capacity:</label>
                <span>{bin.totalCapacity || "N/A"}</span>
              </div>
            </div>

            {/* TOGGLE BUTTON */}
            <button
              className="save-btn full-width"
              onClick={() => {
                if (!showHistory) {
                  fetchCollectionHistory(bin.binid);
                }
                setShowHistory((prev) => !prev);
              }}
            >
              {showHistory
                ? "Hide Collection History"
                : "View Collection History"}
            </button>

            {/* ✅ HISTORY TABLE (MUST BE HERE) */}
            {showHistory && (
              <div className="collection-history">
                {historyLoading ? (
                  <p>Loading history...</p>
                ) : pickupHistory.length === 0 ? (
                  <p className="empty-state">No collection history available</p>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Collector</th>
                        <th>Recycle Center</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickupHistory.map((row) => (
                        <tr key={row.binscheduleid}>
                          <td>{row.pickupdate}</td>
                          <td>{row.users?.username || "N/A"}</td>
                          <td>{row.recyclecenter?.username || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="detail-panel open">
      <div className="panel-header">
        <div className="title-area">
          {content?.type === "profile" && <User size={22} />}
          {content?.type === "inbox" && <Bell size={22} />}
          {content?.type === "bin" && <Trash2 size={22} />}
          <h3>
            {content?.type === "profile"
              ? "Profile Settings"
              : content?.type === "inbox"
                ? "Notifications"
                : "Smart Bin Overview"}
          </h3>
        </div>

        <button className="close-x-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="panel-body">{renderContent()}</div>
    </div>
  );
}

export default DetailPanel;
