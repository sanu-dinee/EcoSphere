import React from "react";
import { View, Text, TouchableOpacity } from "react-native-web";

const PopupModal = ({ visible, title, message, type = "info", onClose }) => {
  if (!visible) return null;

  const color =
    type === "error"
      ? "#dc2626"
      : type === "success"
      ? "#16a34a"
      : "#2563eb";

  return (
    <View
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          padding: 20,
          width: 320,
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
          {title}
        </Text>

        <Text style={{ color: "#555", marginBottom: 16 }}>
          {message}
        </Text>

        <TouchableOpacity
          onPress={onClose}
          style={{
            backgroundColor: color,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            OK
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PopupModal;
