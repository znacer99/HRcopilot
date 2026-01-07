import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "../styles/styles";

import { Colors, Spacing } from "../styles/theme";

export default function ErrorMessage({ message, onRetry }) {
  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: Colors.error }]}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.primaryButton, { paddingVertical: Spacing.sm, marginTop: Spacing.md }]}
          onPress={onRetry}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
