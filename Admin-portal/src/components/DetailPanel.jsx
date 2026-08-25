import { X, Trash2, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import "./DetailPanel.css";

function DetailPanel({ isOpen, content, onClose, onUpdated }) {
  if (!isOpen || content?.type !== "bin") return null;

  const bin = content.data;

  const statusText = (bin.status ?? "").toLowerCase();
  const STATUS_MAP = {
    full: 100,
    "half full": 50,
    empty: 1,
    hidden: 0,
  };
  const fill = STATUS_MAP[statusText] ?? 0;
  const statusClass = statusText.replace(/\s/g, "");

  /* ================= ADMIN ACTIONS ================= */

  const updateStatus = async (newStatus, confirmMessage) => {
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    const { error } = await supabase
      .from("smartbin")
      .update({ status: newStatus })
      .eq("binid", bin.binid);

    if (error) {
      console.error(error);
      alert("Failed to update bin status");
      return;
    }

    alert(`Bin marked as ${newStatus}`);
    onClose();
    onUpdated?.();
  };

  const handleEmptyBin = () => updateStatus("empty", "Mark this bin as EMPTY?");

  const handleHideBin = () =>
    updateStatus("hidden", "Hide this bin temporarily?");

  return (
    <div className="detail-panel open">
      <div className="panel-header">
        <div className="title-area">
          <Trash2 size={22} />
          <h3>Smart Bin Overview</h3>
        </div>

        <button className="close-x-btn" onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      <div className="panel-body">
        <div className="panel-inner">
          <div className="smartbin-card">
            <div className="smartbin-header">
              <div>
                <h4>{bin.location}</h4>
                <span className={`status-pill ${statusClass}`}>
                  {bin.status}
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

            {/* ================= ADMIN ACTIONS ================= */}
            <div className="admin-actions">
              {/* Always allow empty (even if hidden) */}
              <button className="dispatch-btn" onClick={handleEmptyBin}>
                Mark as Empty
              </button>

              {/* Hide only if not already hidden */}
              {statusText !== "hidden" && (
                <button className="hide-btn" onClick={handleHideBin}>
                  <EyeOff size={16} />
                  Hide Bin
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailPanel;
