import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  GoogleMap,
  useJsApiLoader,
  TrafficLayer,
  Marker,
  Polygon,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import * as ai from "./trafficBypassAI.jsx";
const libraries = ["geometry"];

const containerStyle = { width: "100%", height: "100%" };

const bottomPanelStyle = {
  position: "absolute",
  bottom: 100,
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(255,255,255,0.95)",
  padding: "16px 24px",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  zIndex: 900,
  textAlign: "center",
  maxWidth: "90%",
};

const mapTypeControlStyle = {
  position: "absolute",
  top: 60,
  right: 10,
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  background: "white",
  padding: 10,
  borderRadius: 12,
  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
};

const generateCirclePath = (center, radiusMeters) => {
  if (!window.google?.maps?.geometry?.spherical) return [];
  const path = [];
  const numPoints = 60;
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 360;
    const point = window.google.maps.geometry.spherical.computeOffset(
      new window.google.maps.LatLng(center.lat, center.lng),
      radiusMeters,
      angle,
    );
    path.push({ lat: point.lat(), lng: point.lng() });
  }
  path.push(path[0]);
  return path;
};

const generateZoneWaypoints = (center, radiusMeters, pois) => {
  if (!window.google?.maps?.geometry?.spherical) return [];
  const waypoints = [];
  const perimeterPoints = generateCirclePath(center, radiusMeters).slice(0, 12);
  perimeterPoints.forEach((p) =>
    waypoints.push({ location: p, stopover: true }),
  );
  pois.forEach((poi) => {
    if (poi.latitude && poi.longitude) {
      waypoints.push({
        location: {
          lat: parseFloat(poi.latitude),
          lng: parseFloat(poi.longitude),
        },
        stopover: true,
      });
    }
  });
  return waypoints;
};

const humanizeInstruction = (instr) => {
  let text = instr.replace(/<[^>]*>/g, "").trim();
  text = text.replace(/onto (.*)/i, "onto $1");
  text = text.replace(/ slight (left|right)/i, " bear $1");
  text = text.replace(/keep (left|right)/i, "stay $1");
  if (text.includes("roundabout")) {
    text = text.replace(/the (\d+)(?:st|nd|rd|th) exit/i, "take the $1 exit");
  }
  return text;
};

const SmartMap = ({ mode, selectedRoute, selectedLocation, onClose }) => {
  const [map, setMap] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [primaryDirections, setPrimaryDirections] = useState(null);
  const [bypassDirections, setBypassDirections] = useState(null);
  const [directions, setDirections] = useState(null);
  const [etaInfo, setEtaInfo] = useState(null);
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState(null);
  const [pois, setPois] = useState([]);
  const [routePois, setRoutePois] = useState([]);
  const [mapTypeId, setMapTypeId] = useState("roadmap");
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nextInstruction, setNextInstruction] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [navigationEnabled, setNavigationEnabled] = useState(true);

  const [locationIcon, setLocationIcon] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const recalcIgnoreTimer = useRef(null);
  const [previewEta, setPreviewEta] = useState(null);

  const positionUpdateCount = useRef(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const simIndexRef = useRef(0);

  const speechSynthRef = useRef(null);
  const lastStepChangeTime = useRef(0);
  const alertedPOIsRef = useRef(new Set());
  const stopRef = useRef(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const { center, zoom } = useMemo(() => {
    if (navigationStarted && currentPosition) {
      return { center: currentPosition, zoom: 17 };
    }
    if (mode === "location" && selectedLocation) {
      return {
        center: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        },
        zoom: 15,
      };
    }
    if (mode === "route" && selectedRoute) {
      return {
        center: {
          lat: selectedRoute.center_lat,
          lng: selectedRoute.center_lng,
        },
        zoom: 12,
      };
    }
    if (currentPosition) {
      return { center: currentPosition, zoom: 14 };
    }
    return { center: null, zoom: 12 };
  }, [
    navigationStarted,
    currentPosition,
    mode,
    selectedLocation,
    selectedRoute,
  ]);

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [center, map]);

  useEffect(() => {
    ai.createOrLoadModel().catch((err) =>
      setError("AI model load failed: " + err.message),
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        if (pos.coords.heading !== null) {
          setLocationIcon((prev) =>
            prev ? { ...prev, rotation: pos.coords.heading } : null,
          );
        }
      },
      (err) => setError(`Geolocation error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!isLoaded || mode !== "route" || !selectedRoute) return;
    const fetchPois = async () => {
      try {
        const { data: bins } = await supabase
          .from("smartbin")
          .select("latitude,longitude,location,status")
          .eq("status", "full");
        const { data: pickups } = await supabase
          .from("garbagepickupschedule")
          .select(
            "location_lat as latitude, location_long as longitude, location, status",
          )
          .eq("status", "pending");
        const allPois = [...(bins || []), ...(pickups || [])];
        setPois(allPois);

        const centerLatLng = new window.google.maps.LatLng(
          selectedRoute.center_lat,
          selectedRoute.center_lng,
        );
        const radiusMeters = (selectedRoute.radius_km || 3) * 1000 + 1500;
        const filtered = allPois.filter((poi) => {
          if (!poi.latitude || !poi.longitude) return false;
          const dist =
            window.google.maps.geometry.spherical.computeDistanceBetween(
              centerLatLng,
              new window.google.maps.LatLng(
                parseFloat(poi.latitude),
                parseFloat(poi.longitude),
              ),
            );
          return dist <= radiusMeters;
        });
        setRoutePois(filtered);
      } catch (err) {
        setError("POI fetch failed: " + err.message);
      }
    };
    fetchPois();
  }, [isLoaded, mode, selectedRoute]);

  useEffect(() => {
    if (
      !isLoaded ||
      !currentPosition ||
      navigationStarted ||
      !hasDestination() ||
      !navigationEnabled
    )
      return;

    const service = new window.google.maps.DirectionsService();
    const dest =
      mode === "location"
        ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
        : { lat: selectedRoute.center_lat, lng: selectedRoute.center_lng };
    const waypoints =
      mode === "route"
        ? generateZoneWaypoints(
            dest,
            (selectedRoute.radius_km || 3) * 1000,
            routePois,
          )
        : [];

    const primaryReq = {
      origin: currentPosition,
      destination: dest,
      waypoints,
      optimizeWaypoints: mode === "route",
      travelMode: window.google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
      },
    };

    service.route(primaryReq, async (res, stat) => {
      if (stat !== "OK") {
        setError(`Directions failed: ${stat}`);
        return;
      }
      setPrimaryDirections(res);
      const leg = res.routes[0].legs[0];
      setPreviewEta({
        distance: leg.distance_in_traffic?.text || leg.distance.text,
        duration: leg.duration_in_traffic?.text || leg.duration.text,
      });
      if (mode !== "location") return;

      const congProb = await ai.predictCongestionProbability(leg);

      if (congProb < 0.6) return;

      const bypassReq = { ...primaryReq, waypoints: [], avoidHighways: true };
      service.route(bypassReq, (bres, bstat) => {
        if (bstat === "OK") setBypassDirections(bres);
        else setError(`Bypass failed: ${bstat}`);
      });
    });
  }, [
    isLoaded,
    currentPosition,
    mode,
    selectedLocation,
    selectedRoute,
    routePois,
    navigationStarted,
    navigationEnabled,
  ]);

  const hasDestination = () =>
    (mode === "location" && selectedLocation) ||
    (mode === "route" && selectedRoute);

  const startNavigation = async () => {
    stopRef.current = false;
    if (!primaryDirections) {
      setError("No route ready yet.");
      return;
    }
    setNavigationEnabled(true);
    setNavigationStarted(true);
    setPreviewEta(null);
    setAlert(null);
    setError(null);

    let chosen = primaryDirections;
    let isBypass = false;

    if (bypassDirections && mode === "location") {
      const pLeg = primaryDirections.routes[0].legs[0];
      const bLeg = bypassDirections.routes[0].legs[0];
      const pProb = await ai.predictCongestionProbability(pLeg);
      const bProb = await ai.predictCongestionProbability(bLeg);
      if (bProb < pProb) {
        chosen = bypassDirections;
        isBypass = true;
        speak("Traffic detected. Taking AI bypass route.");
        setAlert("AI Bypass Active");
      }
    }

    setDirections(chosen);
    setPendingDirections(null);
    setIsRecalculating(false);
    setAlert(null);
    const leg = chosen.routes[0].legs[0];
    const firstStep = leg.steps[0];
    const firstInstr = humanizeInstruction(
      leg.steps[0]?.instructions || "Proceed along the route.",
    );

    setCurrentStepIndex(0);
    setNextInstruction(firstInstr);
    setEtaInfo({
      distance: leg.distance_in_traffic?.text || leg.distance.text,
      duration: leg.duration_in_traffic?.text || leg.duration.text,
    });

    speak(`Navigation started. ${firstInstr}`);

    positionUpdateCount.current = 0;
    if (recalcIgnoreTimer.current) clearTimeout(recalcIgnoreTimer.current);
    recalcIgnoreTimer.current = setTimeout(() => {
      recalcIgnoreTimer.current = null;
    }, 15000);

    lastStepChangeTime.current = Date.now();

    setPrimaryDirections(null);
    setBypassDirections(null);
  };

  const speak = (text) => {
    if (isMuted || !window.speechSynthesis || !voicesLoaded) {
      console.log("Speech skipped (muted/not loaded):", text);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang === "en-US" &&
        (v.name.includes("Google") ||
          v.name.includes("Microsoft") ||
          v.name.includes("Natural")),
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => console.log("Speech ended:", text);
    utterance.onerror = (e) => console.error("Speech error:", e);

    window.speechSynthesis.speak(utterance);
    speechSynthRef.current = utterance;
  };

  useEffect(() => {
    if (stopRef.current) return;
    if (!navigationStarted || !directions || !currentPosition) return;

    positionUpdateCount.current += 1;

    const route = directions.routes[0];
    const leg = route.legs[0];
    const steps = leg.steps || [];
    if (steps.length === 0 || !steps[currentStepIndex]) return;

    const currentStep = steps[currentStepIndex];
    const stepEnd = currentStep.end_location;

    const userPos = new window.google.maps.LatLng(
      currentPosition.lat,
      currentPosition.lng,
    );
    const distToEnd =
      window.google.maps.geometry.spherical.computeDistanceBetween(
        userPos,
        stepEnd,
      );

    console.log(
      `Step ${currentStepIndex + 1} | Dist: ${distToEnd.toFixed(0)}m | Pos updates: ${positionUpdateCount.current}`,
    );

    // Advance step logic (unchanged or from previous fix)
    const timeOnStep = Date.now() - (lastStepChangeTime.current || Date.now());
    const minTimeOnStep = currentStepIndex === 0 ? 8000 : 4000;

    if (
      (distToEnd < 120 || timeOnStep > 8000) &&
      currentStepIndex < steps.length - 1
    ) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = steps[nextIndex];

      setCurrentStepIndex(nextIndex);

      const nextInstr = humanizeInstruction(
        nextStep.instructions || "Continue",
      );

      setNextInstruction(nextInstr);
      speak(nextInstr);

      lastStepChangeTime.current = Date.now();
    }

    const isInitialPhase =
      recalcIgnoreTimer.current !== null || positionUpdateCount.current < 5;
    if (distToEnd > 350 && !isRecalculating && !isInitialPhase) {
      console.log("OFF-ROUTE → starting recalc (after initial protection)");
      setIsRecalculating(true);
      setAlert("Recalculating route...");

      const service = new window.google.maps.DirectionsService();
      const dest =
        mode === "location"
          ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
          : { lat: selectedRoute.center_lat, lng: selectedRoute.center_lng };

      service.route(
        {
          origin: currentPosition,
          destination: dest,
          travelMode: window.google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
          },
        },
        (res, stat) => {
          if (stat === "OK" && res.routes[0]) {
            console.log("Recalc success → updating route");
            setDirections(res);
            setPendingDirections(null);
            setIsRecalculating(false);
            setAlert(null);

            setCurrentStepIndex(0);
            const newLeg = res.routes[0].legs[0];
            const newInstr = humanizeInstruction(
              newLeg.steps[0]?.instructions || "Following recalculated route",
            );
            setNextInstruction(newInstr);
            speak("Route recalculated. " + newInstr);

            setEtaInfo({
              distance:
                newLeg.distance_in_traffic?.text || newLeg.distance.text,
              duration:
                newLeg.duration_in_traffic?.text || newLeg.duration.text,
            });
          } else {
            console.error("Recalc failed:", stat);
            setAlert(`Recalculation failed (${stat}). Keeping previous route.`);
            setIsRecalculating(false);
          }
        },
      );
    }

    if (locationIcon) {
      const bearing = window.google.maps.geometry.spherical.computeHeading(
        userPos,
        stepEnd,
      );
      setLocationIcon((prev) => (prev ? { ...prev, rotation: bearing } : null));
    }
  }, [
    currentPosition,
    directions,
    navigationStarted,
    currentStepIndex,
    locationIcon,
    mode,
    selectedLocation,
    selectedRoute,
  ]);

  useEffect(() => {
    if (stopRef.current) return;
    if (!navigationStarted || !directions || !isSimulating) return;

    if (isPaused) return;

    const path = directions.routes[0].overview_path;
    if (!path || path.length === 0) return;

    const interval = setInterval(() => {
      if (isPaused) return;

      if (simIndexRef.current >= path.length) {
        clearInterval(interval);
        return;
      }

      const p = path[simIndexRef.current++];
      setCurrentPosition({
        lat: p.lat(),
        lng: p.lng(),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigationStarted, directions, isSimulating, isPaused]);

  useEffect(() => {
    if (stopRef.current) return;
    if (!navigationStarted || !directions || !currentPosition || isPaused)
      return;
    let interval;
    const recalcETA = async () => {
      const service = new window.google.maps.DirectionsService();
      const dest =
        mode === "location"
          ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
          : { lat: selectedRoute.center_lat, lng: selectedRoute.center_lng };

      service.route(
        {
          origin: currentPosition,
          destination: dest,
          travelMode: window.google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
          },
        },
        (res, stat) => {
          if (stat === "OK" && res.routes[0]) {
            const newLeg = res.routes[0].legs[0];
            setEtaInfo({
              distance:
                newLeg.distance_in_traffic?.text || newLeg.distance.text,
              duration:
                newLeg.duration_in_traffic?.text || newLeg.duration.text,
            });
          }
        },
      );
    };

    recalcETA();
    interval = setInterval(recalcETA, 30000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    navigationStarted,
    currentPosition,
    mode,
    selectedLocation,
    selectedRoute,
  ]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
        console.log(
          "Voices loaded:",
          voices.map((v) => v.name),
        );
      }
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  useEffect(() => {
    if (!isLoaded || !window.google?.maps?.SymbolPath) return;

    setLocationIcon({
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      rotation: 0,
      fillColor: "#4285F4",
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: "#FFFFFF",
      anchor: new window.google.maps.Point(0, 2),
    });
  }, [isLoaded]);

  useEffect(() => {
    if (
      !isLoaded ||
      !window.google ||
      !window.google.maps ||
      !window.google.maps.geometry ||
      !window.google.maps.geometry.spherical ||
      !currentPosition
    ) {
      return;
    }

    const checkProximity = () => {
      let closest = null;

      if (mode === "location" && selectedLocation) {
        const dist =
          window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(
              currentPosition.lat,
              currentPosition.lng,
            ),
            new window.google.maps.LatLng(
              selectedLocation.lat,
              selectedLocation.lng,
            ),
          );

        if (dist <= 200) closest = `Target in ${Math.round(dist)}m`;
      } else if (mode === "route" && pois.length) {
        let minDist = Infinity;

        pois.forEach((poi) => {
          if (!poi.latitude || !poi.longitude) return;

          const dist =
            window.google.maps.geometry.spherical.computeDistanceBetween(
              new window.google.maps.LatLng(
                currentPosition.lat,
                currentPosition.lng,
              ),
              new window.google.maps.LatLng(
                parseFloat(poi.latitude),
                parseFloat(poi.longitude),
              ),
            );

          if (dist < minDist && dist <= 200) {
            minDist = dist;
            closest = `${
              poi.status === "full" ? "Full bin" : "Pending pickup"
            } (${Math.round(dist)}m)`;
          }
        });
      }

      if (closest) {
        setAlert(closest);
        if (navigationStarted) speak(closest);
      } else {
        setAlert(null);
      }
    };

    checkProximity();
    const id = setInterval(checkProximity, 8000);
    return () => clearInterval(id);
  }, [
    isLoaded,
    currentPosition,
    mode,
    selectedLocation,
    pois,
    navigationStarted,
  ]);

  const stopNavigation = async () => {
    try {
      stopRef.current = true;
      setNavigationEnabled(false);
      if (directions) {
        const leg = directions.routes[0].legs[0];
        +ai.onlineLearnFromTrip(leg).catch(console.error);
      }

      window.speechSynthesis.cancel();

      setIsSimulating(false);
      simIndexRef.current = 0;

      setNavigationStarted(false);
      setDirections(null);
      setPrimaryDirections(null);
      setBypassDirections(null);
      setEtaInfo(null);
      setPreviewEta(null);
      setAlert(null);

      setCurrentStepIndex(0);
      setNextInstruction("");
      setAlert("Navigation ended");

      console.log("Navigation fully stopped");
    } catch (e) {
      console.error("Stop failed:", e);
    }
  };

  const togglePause = () => {
    if (!navigationStarted) return;

    if (!isPaused) {
      window.speechSynthesis.cancel();
      setIsPaused(true);
      setAlert("Navigation paused");
    } else {
      setIsPaused(false);
      setAlert(null);

      if (nextInstruction) {
        speak(nextInstruction);
      }
    }
  };

  /* if (loadError)
    return (
      <div style={{ color: "red", padding: 20 }}>
        Map load error: {loadError.message}
      </div>
    );*/
  if (!isLoaded) return <div style={{ padding: 20 }}>Loading map...</div>;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {onClose && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
            display: "flex",
            gap: 8,
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.92)",
            padding: "8px 12px",
            borderRadius: "12px",
            boxShadow: "0 3px 14px rgba(0,0,0,0.25)",
            backdropFilter: "blur(6px)",
          }}
        >
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsMuted((prev) => !prev);
            }}
            style={{
              padding: "8px 14px",
              background: isMuted ? "#f44336" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              minWidth: "90px",
              transition: "background 0.2s",
            }}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <button
            onClick={() => {
              const types = ["roadmap", "satellite", "hybrid"];
              const currentIndex = types.indexOf(mapTypeId);
              const nextIndex = (currentIndex + 1) % types.length;
              const nextType = types[nextIndex];
              setMapTypeId(nextType);
              console.log(`Switched to: ${nextType}`);
            }}
            style={{
              padding: "8px 14px",
              background: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              minWidth: "120px",
              transition: "background 0.2s",
            }}
          >
            {mapTypeId === "roadmap"
              ? "Roadmap"
              : mapTypeId === "satellite"
                ? "Satellite"
                : "Hybrid"}
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              background: "#757575",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
      {currentPosition && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          onLoad={setMap}
          mapTypeId={mapTypeId}
          mapTypeControl={false}
        >
          <TrafficLayer />
          {currentPosition && locationIcon && (
            <Marker
              position={currentPosition}
              optimized={false}
              icon={locationIcon}
              title="Your location"
            />
          )}
          {mode === "location" && selectedLocation && (
            <Marker
              position={{
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              }}
            />
          )}
          {mode === "route" && selectedRoute && (
            <Polygon
              paths={generateCirclePath(
                {
                  lat: selectedRoute.center_lat,
                  lng: selectedRoute.center_lng,
                },
                (selectedRoute.radius_km || 3) * 1000,
              )}
              options={{
                fillColor: "#00FF00",
                fillOpacity: 0.18,
                strokeColor: "#006600",
                strokeOpacity: 0.7,
                strokeWeight: 2,
              }}
            />
          )}
          {mode === "route" &&
            routePois.map((poi, i) => (
              <Marker
                key={i}
                position={{
                  lat: parseFloat(poi.latitude),
                  lng: parseFloat(poi.longitude),
                }}
                icon={{
                  url:
                    poi.status === "full"
                      ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                      : "http://maps.google.com/mapfiles/ms/icons/orange-dot.png",
                }}
              />
            ))}
          {primaryDirections && !navigationStarted && (
            <DirectionsRenderer
              directions={primaryDirections}
              options={{
                suppressMarkers: true,
                polylineOptions: { strokeColor: "#4285F4", strokeWeight: 5 },
              }}
            />
          )}
          {bypassDirections && !navigationStarted && mode === "location" && (
            <DirectionsRenderer
              directions={bypassDirections}
              options={{
                suppressMarkers: true,
                polylineOptions: { strokeColor: "#FF9800", strokeWeight: 5 },
              }}
            />
          )}
          {directions && navigationStarted && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: isPaused ? "#9E9E9E" : "#00C853",
                  strokeWeight: 7,
                },
              }}
            />
          )}
          {alert && currentPosition && (
            <InfoWindow position={currentPosition}>
              <div
                style={{
                  background: "#d32f2f",
                  color: "white",
                  padding: "10px",
                  borderRadius: "6px",
                }}
              >
                {alert}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}

      {navigationStarted && (
        <div style={bottomPanelStyle}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              marginBottom: "8px",
              minHeight: "28px",
            }}
          >
            {isPaused
              ? "Navigation paused"
              : nextInstruction || "Following route..."}
          </div>
          {etaInfo && (
            <div>
              Distance: {etaInfo.distance} | Time: {etaInfo.duration}
            </div>
          )}
          {alert && (
            <div
              style={{ color: "#d32f2f", marginTop: "8px", fontWeight: "bold" }}
            >
              {alert}
            </div>
          )}
        </div>
      )}

      {previewEta && !navigationStarted && (
        <div
          style={{
            position: "absolute",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.95)",
            padding: "12px 20px",
            borderRadius: "14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            zIndex: 950,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            Route Preview
          </div>
          <div>
            Distance: {previewEta.distance} | ETA: {previewEta.duration}
          </div>
        </div>
      )}

      {hasDestination() && !navigationStarted && (
        <button
          onClick={startNavigation}
          style={{
            position: "absolute",
            bottom: 20,
            left: "58%",
            transform: "translateX(-50%)",
            padding: "16px 32px",
            background: "#4285F4",
            color: "white",
            fontSize: "18px",
            border: "none",
            borderRadius: "30px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          Start Navigation
        </button>
      )}

      {hasDestination() && !navigationStarted && (
        <button
          onClick={() => {
            setIsSimulating(true);
            simIndexRef.current = 0;
            startNavigation();
          }}
          style={{
            position: "absolute",
            bottom: 20,
            left: "40%",
            transform: "translateX(-50%)",
            padding: "17px 45px",
            background: "#FF9800",
            color: "white",
            fontSize: "16px",
            border: "none",
            borderRadius: "30px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          Simulate Drive
        </button>
      )}
      {navigationStarted && (
        <button
          onClick={togglePause}
          style={{
            position: "absolute",
            bottom: 20,
            right: 140,
            padding: "12px 24px",
            background: isPaused ? "#4CAF50" : "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "30px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
      )}

      {navigationStarted && (
        <button
          onClick={stopNavigation}
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            padding: "12px 24px",
            background: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: "30px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          Stop
        </button>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            bottom: 140,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,0,0,0.9)",
            color: "white",
            padding: "12px 24px",
            borderRadius: 8,
            zIndex: 1000,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default SmartMap;
