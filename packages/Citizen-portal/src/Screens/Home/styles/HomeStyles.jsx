import React from "react";

const Styles = () => (
  <style>{`
    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #010a08;
      color: #f0fdf4;
      font-family: 'Inter', -apple-system, sans-serif;
      /* Prevent horizontal shake, allow vertical scroll */
      overflow-x: hidden; 
      min-height: 100vh;
    }

    .page-container {
      position: relative;
      overflow: scroll;
      overflow-x: hidden;
    }

    /* Molten Emerald Background */
    .molten-bg {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      z-index: -1;
      background: linear-gradient(135deg, #010a08 0%, #064e3b 100%);
    }
    
    .molten-orb {
      position: absolute;
      width: 60vw; height: 60vw;
      background: radial-gradient(circle, #059669 0%, transparent 70%);
      filter: blur(100px);
      opacity: 0.15;
      animation: float 20s infinite alternate;
    }

    @keyframes float {
      from { transform: translate(-10%, -10%); }
      to { transform: translate(20%, 20%); }
    }

    .app-wrapper {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .nav-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 800;
      color: #34d399;
      display: flex;
      align-items: center;
      gap: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    /* THE GRID FIX: No fixed height. Auto-layout. */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 350px 1fr 350px;
      gap: 20px;
      align-items: start;
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 32px;
      padding: 25px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
    }

    /* Tree Stage Container */
    .canvas-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .canvas-holder {
      width: 100%;
      aspect-ratio: 4 / 3; /* Responsive aspect ratio */
      min-height: 400px;
      border-radius: 40px;
      cursor: grab;
      position: relative;
    }

    .points-pill {
      background: rgba(0,0,0,0.4);
      border: 1px solid #059669;
      padding: 15px 30px;
      border-radius: 30px;
      text-align: center;
      margin: 0 auto;
      width: 380px;
    }

    .progress-track {
      width: 350px;
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      margin-top: 10px;
      overflow: hidden;
      margin-left: -12px;
    }

    .progress-fill {
      height: 100%;
      background: #34d399;
      box-shadow: 0 0 15px #34d399;
    }

    .item-btn {
      width: 100%;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 18px;
      border-radius: 20px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      margin-bottom: 12px;
      transition: 0.3s;
    }

    .item-btn:hover {
      background: rgba(16, 185, 129, 0.1);
      border-color: #34d399;
      transform: translateY(-2px);
    }
      .session-banner {
  margin: 12px auto;
  padding: 12px 20px;
  width: fit-content;
  background: rgba(52, 211, 153, 0.15);
  border-radius: 12px;
  color: #34d399;
  font-weight: 600;
}
.celebration-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(46, 125, 50, 0.25); /* Soft green overlay */
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.8s ease-out, fadeOut 1s ease-in 4s forwards;
  pointer-events: none; /* Allows clicks through if needed */
}
/* New class for Thank You fade-out to avoid inheriting bottom positioning */
.celebration-fade-out {
  animation: fadeIn 0.8s ease-out, fadeOut 1s ease-in 4s forwards;
}
.celebrate-box {
  background: white;
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(46, 125, 50, 0.3);
  max-width: 420px;
  width: 90%;
  animation: scaleUp 1.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              glowPulse 3s infinite alternate;
  border: 3px solid #4caf50;
  position: relative;
  overflow: hidden;
}

.celebrate-box h2 {
  font-size: 32px;
  color: #2e7d32;
  margin: 16px 0 12px;
  font-weight: 700;
}

.celebrate-box p {
  font-size: 24px;
  color: #1b5e20;
  margin: 0 0 16px;
}

.celebrate-box small {
  display: block;
  color: #4caf50;
  font-size: 16px;
  font-style: italic;
}

.tree-animation {
  font-size: 64px;
  margin-bottom: 24px;
  animation: growTree 2.5s ease-in-out;
}

.floating-leaves {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-leaves span {
  position: absolute;
  font-size: 32px;
  opacity: 0.7;
  animation: floatUp 6s infinite linear;
}

.floating-leaves span:nth-child(1) { left: 10%; animation-delay: 0s; }
.floating-leaves span:nth-child(2) { left: 30%; animation-delay: 1.2s; }
.floating-leaves span:nth-child(3) { left: 50%; animation-delay: 2.4s; }
.floating-leaves span:nth-child(4) { left: 70%; animation-delay: 3.6s; }
.floating-leaves span:nth-child(5) { left: 90%; animation-delay: 4.8s; }

/* Keyframes */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes glowPulse {
  from { box-shadow: 0 20px 60px rgba(76, 175, 80, 0.3); }
  to { box-shadow: 0 20px 80px rgba(76, 175, 80, 0.5); }
}

@keyframes growTree {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes floatUp {
  0% { transform: translateY(100%) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-150%) rotate(360deg); opacity: 0; }
}

/* Fade out at the end (triggered by timeout) */
.celebration-overlay {
  animation: fadeIn 0.8s ease-out, fadeOut 1s ease-in 3s forwards;
}

@keyframes fadeOut {
  to { opacity: 0; }
}

.item-toast {
  position: fixed;
  top: 90px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 600;
  animation: slideIn 0.4s ease;
  z-index: 999;
}

@keyframes slideIn {
  from {
    transform: translateX(40px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}


    /* Mobile Responsive Logic */
    @media (max-width: 1200px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      .canvas-section {
        order: -1; /* Tree on top */
      }
    }

    @media (max-width: 600px) {
      .app-wrapper { padding: 10px; }
      .canvas-holder { aspect-ratio: 1; min-height: 300px; }
    }
  `}</style>
);

export default Styles;
