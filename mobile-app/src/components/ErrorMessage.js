import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "../styles/styles";

export default function ErrorMessage({ message, onRetry }) {
  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: "#dc2626" }]}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
