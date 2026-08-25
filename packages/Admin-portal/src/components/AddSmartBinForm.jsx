import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MapPicker from "./MapPicker";
import "./AddSmartBinForm.css";

export default function AddSmartBinForm({ onClose, onAdded }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    location: "",
    capacity: "",
    wastetype: "",
    status: "empty",
    latitude: null,
    longitude: null,
    bincode: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMapSelect = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.location || !form.capacity || !form.wastetype) {
      alert("Please fill all required fields");
      return;
    }

    if (form.latitude === null || form.longitude === null) {
      alert("Please select bin location on map");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("smartbin").insert([
      {
        location: form.location.trim(),
        capacity: Number(form.capacity),
        wastetype: form.wastetype,
        status: form.status,
        latitude: form.latitude,
        longitude: form.longitude,
        bincode: form.bincode || null,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Add bin failed:", error);
      alert("Failed to add smart bin");
      return;
    }

    alert("Smart bin added successfully");
    onClose();
    onAdded?.();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Add New SmartBin</h3>

        <form onSubmit={handleSubmit}>
          <label>Location Description *</label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            required
          />

          <label>Capacity (kg) *</label>
          <input
            type="number"
            name="capacity"
            step="0.01"
            value={form.capacity}
            onChange={handleChange}
            required
          />

          <label>Waste Type *</label>
          <select
            name="wastetype"
            value={form.wastetype}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="plastic">Plastic</option>
            <option value="paper">Paper</option>
            <option value="metal">Metal</option>
            <option value="glass">Glass</option>
            <option value="organic">Organic</option>
          </select>

          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="empty">Empty</option>
            <option value="half full">Half Full</option>
            <option value="full">Full</option>
            <option value="hidden">Hidden</option>
          </select>

          <label>Bin Code (optional)</label>
          <input
            type="text"
            name="bincode"
            value={form.bincode}
            onChange={handleChange}
          />

          <label>Select Location on Map *</label>
          <MapPicker onSelect={handleMapSelect} />

          {form.latitude && (
            <p className="coords">
              Selected: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Bin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
