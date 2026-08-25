import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { adminLogin } from "../services/authService.js";
import "./LoginComponent.css";

const LoginComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/admin");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await adminLogin(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* HEADER */}
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <h1>Admin Portal</h1>
          </div>
          <p className="subtitle">Sign in to access the admin dashboard</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* EMAIL */}
          <div className="form-group">
            <label>Email</label>
            <div className="input-with-icon">
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 13L2 6.76V18h20V6.76L12 13zM12 11L2 4h20L12 11z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="admin@ecosystem.lk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <div className="input-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* OPTIONS */}
          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label>Remember me</label>
            </div>

            <button type="button" className="forgot-password">
              Forgot password?
            </button>
          </div>

          {/* BUTTON */}
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* DEMO (optional – keeps CSS intact) */}
          <div className="demo-credentials">
            <p>
              <strong>Admin access only</strong>
            </p>
            <p>Use registered admin email</p>
          </div>
        </form>

        {/* FOOTER */}
        <div className="login-footer">
          <p className="copyright">© 2025 EcoSphere Admin Portal</p>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
