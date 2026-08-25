import React from 'react';

const ReportStyles = () => (
  <style>{`
    .app-viewport {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      min-height: 100vh;
      padding: 20px 16px 120px 16px; /* extra bottom padding for mobile keyboard */
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      color: #064e3b;
      overflow:scroll;
      overflow-x: hidden
    }
    .fixed-mode-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(16, 185, 129, 0.15);
      z-index: 1000;
      padding: 12px 16px;
      box-shadow: 0 4px 20px rgba(5, 150, 105, 0.1);
    }

    .mode-selector-inner {
      display: flex;
      gap: 10px;
      max-width: 720px;
      margin: 0 auto;
    }

    .top-action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      color: #065f46;
      background: rgba(16, 185, 129, 0.08);
      border: 2px solid rgba(16, 185, 129, 0.3);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(8px);
    }

    .top-action-btn:hover {
      background: rgba(16, 185, 129, 0.15);
      border-color: #10b981;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.2);
    }

    .top-action-btn.active {
      background: #059669;
      color: white;
      border-color: #059669;
      box-shadow: 0 8px 20px rgba(5, 150, 105, 0.35);
      transform: translateY(-1px);
    }

    .main-card {
      max-width: 720px;
      margin: 90px auto 40px auto; /* space for fixed bar */
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 32px;
      border: 1px solid rgba(16, 185, 129, 0.18);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      overflow-x: hidden;
    }

    .top-banner {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 40px 24px;
      color: white;
      text-align: center;
    }

    .top-banner h1 {
      margin: 0;
      font-size: clamp(22px, 5vw, 28px);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .top-banner p {
      margin: 8px 0 0;
      opacity: 0.9;
      font-size: 15px;
    }
    .form-pad {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .input-heading {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #059669;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .map-container-box {
      height: 320px;
      border-radius: 24px;
      overflow: hidden;
      border: 3px solid rgba(236, 253, 245, 0.8);
      box-shadow: 0 8px 24px rgba(5, 150, 105, 0.15);
      position: relative;
    }

    .locate-me-btn {
      position: absolute;
      bottom: 16px;
      right: 16px;
      z-index: 10;
      background: white;
      border: none;
      padding: 12px 18px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 14px;
      color: #059669;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
      transition: all 0.2s;
    }

    .locate-me-btn:hover {
      background: #ecfdf5;
      transform: scale(1.05);
    }

    .drop-zone {
      border: 3px dashed #10b981;
      background: rgba(236, 253, 245, 0.5);
      border-radius: 24px;
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .drop-zone:hover,
    .drop-zone.dragging {
      border-color: #059669;
      background: rgba(236, 253, 245, 0.8);
      transform: scale(1.02);
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .photo-item {
      position: relative;
      aspect-ratio: 1 / 1;
      border-radius: 16px;
      overflow: hidden;
      border: 3px solid #ecfdf5;
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
      transition: transform 0.2s;
    }

    .photo-item:hover {
      transform: scale(1.04);
    }

    .remove-photo-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(239, 68, 68, 0.95);
      color: white;
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .camera-action-text {
      font-size: 16px;
      font-weight: 700;
      color: #059669;
    }

    .description-box,
    .date-input {
      width: 100%;
      padding: 16px 18px;
      border-radius: 18px;
      border: 2px solid #e5e7eb;
      background: white;
      font-size: 16px;
      line-height: 1.5;
      font-family: inherit;
      transition: all 0.2s;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
    }

    .description-box:focus,
    .date-input:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
    }

    .send-report-btn,
    .send-pickup-btn {
      padding: 18px 24px;
      border: none;
      border-radius: 20px;
      font-size: 17px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 12px 24px rgba(5, 150, 105, 0.25);
    }

    .send-report-btn {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
    }

    .send-report-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 32px rgba(5, 150, 105, 0.35);
    }

    .send-pickup-btn {
     background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
    }

    .send-pickup-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 16px 32px rgba(5, 150, 105, 0.35);
    }

    /* Disabled state */
    .send-report-btn:disabled,
    .send-pickup-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    @media (max-width: 480px) {
      .form-pad {
        padding: 24px 18px;
        gap: 28px;
      }

      .top-banner {
        padding: 32px 20px;
      }

      .map-container-box {
        height: 280px;
      }

      .top-action-btn {
        font-size: 14px;
        padding: 12px;
      }

      .photo-grid {
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      }
    }

    @media (max-width: 360px) {
      .mode-selector-inner {
        flex-direction: column;
        gap: 12px;
      }

      .top-action-btn {
        width: 100%;
      }
    }
  `}</style>
);

export default ReportStyles;