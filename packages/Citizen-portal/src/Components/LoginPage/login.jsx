import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./style/LoginPage.module.css";
import logo from "../../assets/images/logo.png";
import { citizenLogin } from "../../services/authService";
import { sendPasswordReset } from "../../services/authService";

// Background images
import bg1 from "../Images/Caro1.jpg";
import bg2 from "../Images/Caro2.jpg";
import bg3 from "../Images/Caro3.jpg";
import bg4 from "../Images/Caro4.jpg";
import bg5 from "../Images/Caro5.jpg";

const backgroundImages = [bg1, bg2, bg3, bg4, bg5];

const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user]);

  const [index, setIndex] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReset, setIsLoadingReset] = useState(false);

  // Preload background images
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

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    return "";
  };

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
    };
    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await citizenLogin(formData.email, formData.password);
      navigate("/dashboard");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "Invalid email or password",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter your email to reset password",
      }));
      return;
    }

    setIsLoadingReset(true);
    try {
      await sendPasswordReset(formData.email);
      alert("Password reset email sent! Check your inbox (and spam folder).");
    } catch (error) {
      alert(error.message || "Failed to send reset email");
    } finally {
      setIsLoadingReset(false);
    }
  };

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
            <h2 className={styles.heroTitle}>Welcome Back!</h2>
            <p className={styles.heroSubtitle}>
              Log in to continue your sustainable journey
            </p>
          </div>

          {errors.general && (
            <div className={styles.errorMessage}>{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                id="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                aria-invalid={!!errors.email}
                required
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                id="password"
                placeholder="Password *"
                value={formData.password}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                aria-invalid={!!errors.password}
                required
              />
              {errors.password && (
                <span className={styles.errorText}>{errors.password}</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isLoadingReset}
              className={styles.forgotPassword}
            >
              {isLoadingReset ? (
                <>
                  <span className={styles.spinner}></span>
                  Sending reset link...
                </>
              ) : (
                "Forgot Password?"
              )}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`${styles.btnPrimary} ${isSubmitting ? styles.btnDisabled : ""}`}
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* NEW: Sign Up Redirect */}
          <div className={styles.signupRedirect}>
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className={styles.signupLink}>
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;