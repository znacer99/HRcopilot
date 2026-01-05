import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DocButton({ label, icon, available, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.button, !available && styles.disabled]}
      onPress={onPress}
      disabled={!available}
    >
      <Ionicons
        name={icon}
        size={20}
        color={available ? "#2563eb" : "#9ca3af"}
      />
      <Text style={[styles.label, !available && styles.disabledText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    marginLeft: 10,
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
  },
  disabledText: {
    color: "#9ca3af",
  },
});
