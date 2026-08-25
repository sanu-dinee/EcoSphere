// QRScannerPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { Map, Marker } from "pigeon-maps";
import { RECYCLING_CENTERS } from "./constant/centers";
import "./style/QrScanner.css";

const QRScannerPage = () => {
  const scanLock = useRef(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Map states FIXED
  const [activeCenter, setActiveCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([7.873, 80.772]);
  const [mapZoom, setMapZoom] = useState(7);
  const [isLocating, setIsLocating] = useState(false); // Added

  const { user } = useAuth();
  const navigate = useNavigate();
  const BRIDGE_URL = import.meta.env.VITE_BRIDGE_URL;

  const locateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        setMapCenter(loc);
        setMapZoom(13);
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        alert("Location denied. Select manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  };

  // Auto-locate on mount FIXED
  useEffect(() => {
    locateMe();
  }, []);

  useEffect(() => {
    if (!isScanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 280, height: 280 },
      },
      false,
    );

    const onScanSuccess = async (decodedText) => {
      if (scanLock.current) return;
      scanLock.current = true;

      try {
        const clean = decodedText.trim();
        let binId = null;

        // Accept: "BIN:4", "SMARTBIN:4", "4"
        if (clean.includes(":")) {
          binId = clean.split(":")[1];
        } else if (/^\d+$/.test(clean)) {
          binId = clean;
        }

        if (!binId) throw new Error("INVALID_QR");

        // 🔴 1. CHECK BIN STATUS (FULL / AVAILABLE)
        const { data: bin, error: binErr } = await supabase
          .from("smartbin")
          .select("status")
          .eq("binid", binId)
          .single();

        if (binErr || !bin) {
          throw new Error("BIN_NOT_FOUND");
        }

        if (bin.status === "full") {
          alert(
            "❌ Sorry, this Smart Bin is currently FULL. Please use another bin.",
          );
          scanLock.current = false;
          return;
        }

        // 🔍 2. CHECK IF BIN ALREADY HAS ACTIVE SESSION
        const { data: existing } = await supabase
          .from("bin_sessions")
          .select("session_id")
          .eq("bin_id", binId)
          .eq("status", "active")
          .maybeSingle();

        if (existing) {
          alert("🚫 This Smart Bin is currently in use");
          scanLock.current = false;
          return;
        }

        // 🚀 3. START SESSION
        const { error } = await supabase.from("bin_sessions").insert({
          bin_id: binId,
          citizen_id: user.id,
          status: "active",
        });

        if (error) throw error;

        // Optional local marker
        localStorage.setItem(
          "activeBinSession",
          JSON.stringify({
            binId,
            citizenId: user.id,
            startedAt: Date.now(),
          }),
        );

        await scanner.clear();
        setIsScanning(false);
        setShouldRedirect(true);

        window.location.replace("/dashboard");
      } catch (err) {
        console.error(err);
        scanLock.current = false;
        alert("❌ Invalid or unavailable Smart Bin QR");
      }
    };

    scanner.render(onScanSuccess, () => {});

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isScanning, user, navigate]);
  useEffect(() => {
    if (shouldRedirect) {
      navigate("/dashboard", { replace: true });
    }
  }, [shouldRedirect, navigate]);

  return (
    <div className="page">
      <div className="scannerContainer">
        <h2 className="title">QR Code Scanner</h2>
        <p className="instruction">Point camera at Smart Bin QR</p>

        {isScanning && <div id="qr-reader" className="qrReader" />}

        {scanResult && (
          <div className="result">
            {scanResult.success ? (
              <p>✅ Session started for Bin {scanResult.binId}</p>
            ) : (
              <p>{scanResult.error}</p>
            )}
            <button className="restartBtn" onClick={handleRestart}>
              Scan Again
            </button>
          </div>
        )}

        {/* Map Section */}
        <div className="mapSection">
          <h3 className="mapTitle">EcoSphere Recycling Centers 🇱🇰</h3>
          <p className="mapInstruction">
            🔴 Centers | 🔵 You{isLocating && " (locating...)"}
          </p>

          <div className="mapContainer">
            <Map
              center={mapCenter}
              zoom={mapZoom}
              height={450}
              width="100%"
              metaWheelZoom={true}
              onClick={({ latLng, event }) => {
                setUserLocation(latLng);
                setMapCenter(latLng);
                setMapZoom(13);
              }}
            >
              {/* Centers (RED) */}
              {RECYCLING_CENTERS.map((center, i) => (
                <Marker
                  key={i}
                  anchor={[center.lat, center.lng]}
                  color="#e53935"
                  width={24}
                  onClick={() =>
                    setActiveCenter(
                      activeCenter?.name === center.name ? null : center,
                    )
                  }
                />
              ))}

              {/* User (BLUE) */}
              {userLocation && (
                <Marker anchor={userLocation} color="#1e88e5" width={28} />
              )}
            </Map>

            <button
              className="locateBtn"
              onClick={locateMe}
              disabled={isLocating}
            >
              {isLocating ? "Locating..." : "Locate Me"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
