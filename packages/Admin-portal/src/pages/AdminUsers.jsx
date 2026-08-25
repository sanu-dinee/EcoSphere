import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminUsers.css";
import MapPicker from "../components/MapPicker";

const ROLE_LABELS = {
  1: "Admin",
  3: "Municipal Council",
  4: "Recycle Center",
  5: "Partner Store",
};
const RECYCLE_WASTE_TYPES = [
  "Plastic",
  "Glass",
  "Paper",
  "Metal",
  "Organic",
  "E-waste",
];

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState("view");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapTarget, setMapTarget] = useState(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  // ===== CREATE USER STATE =====
  const [userType, setUserType] = useState("");

  const [common, setCommon] = useState({
    email: "",
    password: "",
    username: "",
    contactnum: "",
  });

  const [council, setCouncil] = useState({
    councilname: "",
    division: "",
    nearestCity: "",
    latitude: null,
    longitude: null,
  });

  const [center, setCenter] = useState({
    centername: "",
    nearestCity: "",
    latitude: null,
    longitude: null,
    wastetypes: [],
  });

  const [store, setStore] = useState({
    storename: "",
    nearestCity: "",
    latitude: null,
    longitude: null,
    category: "",
  });

  const [admin, setAdmin] = useState({ role: "", managedarea: "" });

  // ===== FETCH USERS =====
  useEffect(() => {
    if (activeTab === "view") fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select(
        `
    id,
    username,
    email,
    usertype (
      id,
      usertypename
    )
  `,
      )
      .order("username", { ascending: true });

    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const handleCommonChange = (e) => {
    setCommon({ ...common, [e.target.name]: e.target.value });
  };
  const toggleWasteType = (type) => {
    setCenter((prev) => ({
      ...prev,
      wastetypes: prev.wastetypes.includes(type)
        ? prev.wastetypes.filter((t) => t !== type)
        : [...prev.wastetypes, type],
    }));
  };
  const generatePasswordChangeCode = (length = 16) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // ===== BASIC VALIDATION =====
    if (!userType || !common.email || !common.username) {
      alert("Please fill all required common details.");
      return;
    }

    // ✅ Validation for Recycle Center
    if (userType === "4" && center.wastetypes.length === 0) {
      alert("Please select at least one accepted waste type.");
      return;
    }

    const payload = {
      userType: Number(userType),
      common,
      council,
      center,
      store,
      admin,
      passwordChangeCode: generatePasswordChangeCode(),
    };

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "admin-create-user",
        {
          body: payload,
        },
      );

      if (error) {
        throw error;
      }

      alert("User created successfully.");
      setActiveTab("view");
      fetchUsers();
    } catch (err) {
      console.error("Create user failed:", err);
      alert(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async (email) => {
    const confirmSend = window.confirm(`Send magic login link to ${email}?`);
    if (!confirmSend) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/login",
      },
    });

    if (error) {
      console.error("Magic link error:", error);
      alert("Failed to send magic link");
    } else {
      alert("Magic login link sent successfully");
    }
  };
  const filteredUsers = users.filter((u) => {
    const matchesEmail = u.email
      ?.toLowerCase()
      .includes(searchEmail.toLowerCase());

    const matchesType =
      filterType === "ALL" || String(u.usertype?.id) === filterType;

    return matchesEmail && matchesType;
  });

  return (
    <div className="admin-users-page">
      <h2>User Management</h2>

      {/* Tabs */}
      <div className="tab-bar">
        <button
          className={activeTab === "view" ? "active" : ""}
          onClick={() => setActiveTab("view")}
        >
          View Users
        </button>
        <button
          className={activeTab === "create" ? "active" : ""}
          onClick={() => setActiveTab("create")}
        >
          Create User
        </button>
      </div>

      {/* ===== VIEW USERS ===== */}
      {activeTab === "view" && (
        <>
          {/* ===== Filters ===== */}
          <div className="user-filters">
            <input
              type="text"
              placeholder="Search by email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All User Types</option>
              <option value="1">Admin</option>
              <option value="3">Municipal Council</option>
              <option value="4">Recycle Center</option>
              <option value="5">Partner Store</option>
            </select>
          </div>

          <div className="user-table-wrapper">
            {loading ? (
              <p>Loading users...</p>
            ) : filteredUsers.length === 0 ? (
              <p>No users match the selected criteria.</p>
            ) : (
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>User Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.usertype?.usertypename}</td>
                      <td>
                        <button
                          className="magic-link-btn"
                          onClick={() => sendMagicLink(u.email)}
                        >
                          Send Magic Link
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ===== CREATE USER ===== */}
      {activeTab === "create" && (
        <form className="user-form" onSubmit={handleCreateUser}>
          <label>User Type</label>
          <select
            value={userType}
            onChange={(e) => setUserType(e.target.value)}
          >
            <option value="">Select</option>
            <option value="1">Admin</option>
            <option value="3">Municipal Council</option>
            <option value="4">Recycle Center</option>
            <option value="5">Partner Store</option>
          </select>

          {userType && (
            <>
              <h3>Common Details</h3>
              <input
                name="email"
                placeholder="Email"
                onChange={handleCommonChange}
              />
              <input
                name="username"
                placeholder="Username"
                onChange={handleCommonChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleCommonChange}
              />
              <input
                name="contactnum"
                placeholder="Contact Number"
                onChange={handleCommonChange}
              />
            </>
          )}

          {userType === "3" && (
            <>
              <h3>Council Details</h3>

              <input
                placeholder="Council Name"
                onChange={(e) =>
                  setCouncil({ ...council, councilname: e.target.value })
                }
              />

              <input
                placeholder="Nearest City"
                onChange={(e) =>
                  setCouncil({ ...council, nearestCity: e.target.value })
                }
              />

              <input
                placeholder="Latitude"
                value={council.latitude ?? ""}
                readOnly
              />

              <input
                placeholder="Longitude"
                value={council.longitude ?? ""}
                readOnly
              />

              <button
                type="button"
                onClick={() => {
                  setMapTarget("council");
                  setShowMap(true);
                }}
              >
                Pick Exact Location
              </button>

              <input
                placeholder="Division"
                onChange={(e) =>
                  setCouncil({ ...council, division: e.target.value })
                }
              />
            </>
          )}

          {userType === "4" && (
            <>
              <h3>Recycle Center Details</h3>

              <input
                placeholder="Center Name"
                onChange={(e) =>
                  setCenter({ ...center, centername: e.target.value })
                }
              />
              <input
                placeholder="Nearest City"
                value={center.nearestCity}
                onChange={(e) =>
                  setCenter({ ...center, nearestCity: e.target.value })
                }
              />

              <input
                placeholder="Latitude"
                value={center.latitude ?? ""}
                readOnly
              />
              <input
                placeholder="Longitude"
                value={center.longitude ?? ""}
                readOnly
              />

              <button
                type="button"
                onClick={() => {
                  setMapTarget("center");
                  setShowMap(true);
                }}
              >
                Pick Exact Location
              </button>

              {/* ✅ NEW: Waste Types (Checkboxes) */}
              <div className="checkbox-group">
                <label>Accepted Waste Types</label>

                <div className="checkbox-list">
                  {RECYCLE_WASTE_TYPES.map((type) => (
                    <label key={type} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={center.wastetypes.includes(type)}
                        onChange={() => toggleWasteType(type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {userType === "5" && (
            <>
              <h3>Partner Store Details</h3>

              <input
                placeholder="Store Name"
                onChange={(e) =>
                  setStore({ ...store, storename: e.target.value })
                }
              />

              <input
                placeholder="Nearest City"
                value={store.nearestCity}
                onChange={(e) =>
                  setStore({ ...store, nearestCity: e.target.value })
                }
              />

              <input
                placeholder="Latitude"
                value={store.latitude ?? ""}
                readOnly
              />
              <input
                placeholder="Longitude"
                value={store.longitude ?? ""}
                readOnly
              />

              <button
                type="button"
                onClick={() => {
                  setMapTarget("store");
                  setShowMap(true);
                }}
              >
                Pick Exact Location
              </button>

              <input
                placeholder="Category"
                onChange={(e) =>
                  setStore({ ...store, category: e.target.value })
                }
              />
            </>
          )}

          {userType === "1" && (
            <>
              <h3>Admin Details</h3>
              <input
                placeholder="Role"
                onChange={(e) => setAdmin({ ...admin, role: e.target.value })}
              />
              <input
                placeholder="Managed Area"
                onChange={(e) =>
                  setAdmin({ ...admin, managedarea: e.target.value })
                }
              />
            </>
          )}
          {showMap && (
            <div className="map-modal-overlay">
              <div className="map-modal">
                <h3>Select Location</h3>

                <MapPicker
                  onSelect={(lat, lng) => {
                    if (mapTarget === "council") {
                      setCouncil({
                        ...council,
                        latitude: lat,
                        longitude: lng,
                      });
                    }

                    if (mapTarget === "center") {
                      setCenter({
                        ...center,
                        latitude: lat,
                        longitude: lng,
                      });
                    }

                    if (mapTarget === "store") {
                      setStore({
                        ...store,
                        latitude: lat,
                        longitude: lng,
                      });
                    }

                    setShowMap(false);
                  }}
                />

                <button onClick={() => setShowMap(false)}>Close</button>
              </div>
            </div>
          )}

          {userType && <button type="submit">Create User</button>}
        </form>
      )}
    </div>
  );
}
