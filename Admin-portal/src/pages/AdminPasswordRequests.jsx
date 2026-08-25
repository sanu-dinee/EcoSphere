import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminSettings.css";

export default function AdminPasswordRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("passwordChangeRequest")
      .select("id, changecode, status")
      .order("id", { ascending: false });

    if (!error) setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const sendResetEmail = async (id) => {
    if (!window.confirm("Send password reset email?")) return;

    const { error } = await supabase.functions.invoke(
      "admin-send-password-reset",
      {
        body: { requestId: id },
      },
    );

    if (error) {
      alert("Failed to send reset email");
    } else {
      alert("Reset email sent");
      fetchRequests();
    }
  };

  return (
    <div className="settings-section">
      <h3>Password Change Requests</h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Change Code</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.changecode}</td>
                <td>{r.status}</td>
                <td>
                  {r.status === "pending" ? (
                    <button onClick={() => sendResetEmail(r.id)}>
                      Send Reset Email
                    </button>
                  ) : (
                    <span>Sent</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
