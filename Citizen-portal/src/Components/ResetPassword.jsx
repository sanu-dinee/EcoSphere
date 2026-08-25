import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ResetPassword.module.css";
import logo from "../assets/images/logo.png";

// Background images (same as Login/Signup for consistency)
import bg1 from "./Images/Caro1.jpg";
import bg2 from "./Images/Caro2.jpg";
import bg3 from "./Images/Caro3.jpg";
import bg4 from "./Images/Caro4.jpg";
import bg5 from "./Images/Caro5.jpg";

const backgroundImages = [bg1, bg2, bg3, bg4, bg5];

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [index, setIndex] = useState(0);

  const navigate = useNavigate();

  // Preload images
  useEffect(() => {
    backgroundImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Background shuffle
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6500);
    return () => clearInterval(interval);
  }, []);

  // Listen for PASSWORD_RECOVERY event
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }

    setIsSubmitting(false);
  };

  // Loading state while validating link
  if (!ready) {
    return (
      <main className={styles.landingPage}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className={styles.bgImage}
            style={{ backgroundImage: `url(${backgroundImages[index]})` }}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </AnimatePresence>
        <div className={styles.overlay} />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Validating reset link...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.landingPage}>
      {/* Background Shuffle */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className={styles.bgImage}
          style={{ backgroundImage: `url(${backgroundImages[index]})` }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </AnimatePresence>

      <div className={styles.overlay} />

      <section className={styles.content}>
        <div className={styles.innerContent}>
          <header className={styles.header}>
            <img src={logo} alt="EcoSphere Logo" className={styles.logo} />
          </header>

          <div className={styles.welcomeSection}>
            <h2 className={styles.heroTitle}>Reset Your Password</h2>
            <p className={styles.heroSubtitle}>
              Enter a new secure password for your account
            </p>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
          {message && <div className={styles.successMessage}>{message}</div>}

          <form onSubmit={handleReset} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="password"
                placeholder="New Password *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
                minLength="6"
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                placeholder="Confirm New Password *"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.btnPrimary} ${isSubmitting ? styles.btnDisabled : ""}`}
            >
              {isSubmitting ? "Updating Password..." : "Update Password"}
            </button>
          </form>

          <div className={styles.loginRedirect}>
            <p>
              Remember your password?{" "}
              <a href="/login" className={styles.loginLink}>
                Back to Login
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;