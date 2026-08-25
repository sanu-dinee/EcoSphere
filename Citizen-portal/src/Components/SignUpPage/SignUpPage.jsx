import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./style/SignupPage.module.css";
import logo from "../../assets/images/logo.png";
import { signUpCitizen } from "../../services/authService";

// images for background shuffle
import bg1 from "../Images/Caro1.jpg";
import bg2 from "../Images/Caro2.jpg";
import bg3 from "../Images/Caro3.jpg";
import bg4 from "../Images/Caro4.jpg";
import bg5 from "../Images/Caro5.jpg";

const backgroundImages = [bg1, bg2, bg3, bg4, bg5];

const SignupPage = () => {
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);

  const [index, setIndex] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: "",
    general: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const navigate = useNavigate();

  // Preload images
  useEffect(() => {
    backgroundImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Shuffle background
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6500);
    return () => clearInterval(interval);
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({
        ...prev,
        [id]: "",
      }));
    }

    // Check password strength in real-time
    if (id === "password") {
      checkPasswordStrength(value);
    }

    // Clear confirm password error if password changes
    if (id === "password" && errors.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "",
      }));
    }
  };

  // Check password strength
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength("");
      return;
    }

    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    const mediumRegex =
      /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/;

    if (strongRegex.test(password)) {
      setPasswordStrength("strong");
    } else if (mediumRegex.test(password)) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("weak");
    }
  };

  // Validation functions
  const validateFullName = (name) => {
    if (!name.trim()) return "Full name is required";
    if (name.length < 3) return "Full name must be at least 3 characters";
    return "";
  };

  const validateUsername = (username) => {
    if (!username.trim()) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    return "";
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const validateTerms = (agreeToTerms) => {
    if (!agreeToTerms) return "You must agree to the terms and conditions";
    return "";
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {
      fullName: validateFullName(formData.fullName),
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(
        formData.confirmPassword,
        formData.password
      ),
      agreeToTerms: validateTerms(formData.agreeToTerms),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((err) => err !== "");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await signUpCitizen({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        fullname: formData.fullName,
      });

      setShowVerificationNotice(true);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "Signup failed",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get password strength class
  const getPasswordStrengthClass = () => {
    switch (passwordStrength) {
      case "weak":
        return styles.passwordWeak;
      case "medium":
        return styles.passwordMedium;
      case "strong":
        return styles.passwordStrong;
      default:
        return "";
    }
  };

  // Get password strength text
  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case "weak":
        return "Weak password";
      case "medium":
        return "Medium strength";
      case "strong":
        return "Strong password";
      default:
        return "";
    }
  };

  if (showVerificationNotice) {
    return (
      <main className={styles.landingPage}>
        {/* Static background - no shuffling */}
        <div
          className={styles.bgImage}
          style={{
            backgroundImage: `url(${backgroundImages[index]})`,
          }}
        />
        <div className={styles.overlay} />

        <section className={styles.content}>
          <div className={styles.innerContent}>
            <header className={styles.header}>
              <Link to="/">
                <img src={logo} alt="EcoSphere Logo" className={styles.logo} />
              </Link>
            </header>

            <div className={styles.successSection}>
              <h2 className={styles.heroTitle}>
                Account Created Successfully! 📬
              </h2>
              <p className={styles.heroSubtitle}>
                We've sent a verification email to
                <br />
                <strong>{formData.email}</strong>.
                <br />
                <br />
                Please check your inbox (and spam/junk folder) to verify your
                account.
                <br />
                <br />
                Thank you for joining EcoSphere!
                <br />
                Let's make the world greener together. 🌱
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.landingPage}>
      {/* 🔄 Image Shuffle Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className={styles.bgImage}
          style={{
            backgroundImage: `url(${backgroundImages[index]})`,
          }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Emerald overlay */}
      <div className={styles.overlay} />

      {/* Content */}
      <section className={styles.content}>
        <div className={styles.innerContent}>
          <header className={styles.header}>
            <Link to="/">
              <img src={logo} alt="EcoSphere Logo" className={styles.logo} />
            </Link>
          </header>

          {/* Welcome Section */}
          <div className={styles.welcomeSection}>
            <h2 className={styles.heroTitle}>Join EcoSphere</h2>
            <p className={styles.heroSubtitle}>
              Create your account to start your sustainable journey
            </p>
          </div>

          {/* Display general error */}
          {errors.general && (
            <div className={styles.errorMessage}>{errors.general}</div>
          )}

          {/* Signup Form */}
          <form id="signupForm" onSubmit={handleSubmit} className={styles.form}>
            {/* Full Name */}
            <div className={styles.inputGroup}>
              <input
                type="text"
                id="fullName"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`${styles.input} ${
                  errors.fullName ? styles.inputError : ""
                }`}
                aria-invalid={!!errors.fullName}
                aria-describedby={
                  errors.fullName ? "fullName-error" : undefined
                }
                required
              />
              {errors.fullName && (
                <span id="fullName-error" className={styles.errorText}>
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Email */}
            <div className={styles.inputGroup}>
              <input
                type="email"
                id="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleInputChange}
                className={`${styles.input} ${
                  errors.email ? styles.inputError : ""
                }`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                required
              />
              {errors.email && (
                <span id="email-error" className={styles.errorText}>
                  {errors.email}
                </span>
              )}
            </div>

            {/* Username */}
            <div className={styles.inputGroup}>
              <input
                type="text"
                id="username"
                placeholder="Username *"
                value={formData.username}
                onChange={handleInputChange}
                className={`${styles.input} ${
                  errors.username ? styles.inputError : ""
                }`}
                aria-invalid={!!errors.username}
                aria-describedby={
                  errors.username ? "username-error" : undefined
                }
                required
              />
              {errors.username && (
                <span id="username-error" className={styles.errorText}>
                  {errors.username}
                </span>
              )}
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
              <input
                type="password"
                id="password"
                placeholder="Create Password *"
                value={formData.password}
                onChange={handleInputChange}
                className={`${styles.input} ${
                  errors.password ? styles.inputError : ""
                } ${getPasswordStrengthClass()}`}
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
                required
              />
              {formData.password && (
                <div
                  className={`${styles.passwordStrength} ${styles[passwordStrength]}`}
                >
                  <span>{getPasswordStrengthText()}</span>
                  <div className={styles.strengthBar}>
                    <div className={styles.strengthFill}></div>
                  </div>
                </div>
              )}
              {errors.password && (
                <span id="password-error" className={styles.errorText}>
                  {errors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className={styles.inputGroup}>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm Password *"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`${styles.input} ${
                  errors.confirmPassword ? styles.inputError : ""
                }`}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirm-error" : undefined
                }
                required
              />
              {errors.confirmPassword && (
                <span id="confirm-error" className={styles.errorText}>
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className={styles.termsGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxText}>
                  I agree to the{" "}
                  <Link to="/terms" className={styles.termsLink}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className={styles.termsLink}>
                    Privacy Policy
                  </Link>
                  <span className={styles.required}>*</span>
                </span>
              </label>
              {errors.agreeToTerms && (
                <span className={styles.errorText}>{errors.agreeToTerms}</span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`${styles.btnPrimary} ${
                isSubmitting ? styles.btnDisabled : ""
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>

            {/* Login redirect */}
            <div className={styles.loginRedirect}>
              <p>
                Already have an account?{" "}
                <Link to="/login" className={styles.loginLink}>
                  Log in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

export default SignupPage;
