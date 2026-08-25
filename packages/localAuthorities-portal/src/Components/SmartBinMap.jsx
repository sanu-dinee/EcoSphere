import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

import binFull from "../assets/icons/bin-full.png";
import binHalf from "../assets/icons/bin-half.png";
import binEmpty from "../assets/icons/bin-empty.png";
import binInactive from "../assets/icons/inactive.png";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function SmartBinMap({ onBinSelect, refreshKey }) {
  const [bins, setBins] = useState([]);

  const binIcons = {
    full: new L.Icon({
      iconUrl: binFull,
      iconSize: [42, 42],
      iconAnchor: [21, 42],
    }),
    "half full": new L.Icon({
      iconUrl: binHalf,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    }),
    empty: new L.Icon({
      iconUrl: binEmpty,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    }),
    hidden: new L.Icon({
      iconUrl: binInactive,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    }),
  };

  useEffect(() => {
    const fetchBins = async () => {
      const { data, error } = await supabase.from("smartbin").select("*");

      if (error) {
        console.error("Error fetching bins:", error);
        return;
      }

      const formattedBins = data.map((bin) => {
        const normalizedStatus = (bin.status ?? "")
          .toLowerCase()
          .trim()
          .replace(/_/g, " ");

        return {
          binid: bin.binid,
          location: bin.location,
          lat: Number(bin.latitude),
          lng: Number(bin.longitude),
          status: normalizedStatus,
          wastetype: bin.wastetype,
          totalCapacity: `${bin.capacity} kg`,
        };
      });

      setBins(formattedBins);
    };

    fetchBins();
  }, [refreshKey]); // 🔄 auto refresh after admin updates

  return (
    <MapContainer
      center={[6.9271, 79.8612]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {bins.map((bin) => {
        const isHidden = bin.status === "hidden";

        return (
          <Marker
            key={bin.binid}
            position={[bin.lat, bin.lng]}
            icon={binIcons[bin.status] || binIcons.empty}
            {...(!isHidden && {
              eventHandlers: {
                click: () =>
                  onBinSelect({
                    type: "bin",
                    data: bin,
                  }),
              },
            })}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {bin.location}
              {isHidden && " (Inactive)"}
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default SmartBinMap;
