import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./style/LandingPage.module.css";
import logo from "../../assets/images/logo.png";
import { image } from "framer-motion/client";

// images for background shuffle
import bg1 from "../Images/Caro1.jpg";
import bg2 from "../Images/Caro2.jpg";
import bg3 from "../Images/Caro3.jpg";
import bg4 from "../Images/Caro4.jpg";
import bg5 from "../Images/Caro5.jpg";

const backgroundImages = [bg1, bg2, bg3, bg4, bg5];

const LandingPage = () => {
  const [index, setIndex] = useState(0);

  // Preload images (no flicker)
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
        <header className={styles.header}>
          <img src={logo} alt="EcoSphere Logo" className={styles.logo} />
          <h1 className={styles.title}>EcoSphere</h1>
        </header>

        <div className={styles.hero}>
          <h2 className={styles.heroTitle}>Recycle Smarter, Live Better</h2>
          <p className={styles.heroSubtitle}>
            Join the next generation of eco-warriors. Track, earn, and make a
            real impact.
          </p>
        </div>

        <div className={styles.ctaGroup}>
          <Link to="/signup" className={styles.btnPrimary}>
            Start Free
          </Link>
          <Link to="/login" className={styles.btnSecondary}>
            Log In
          </Link>
        </div>

      </section>
    </main>
  );
};

export default LandingPage;
