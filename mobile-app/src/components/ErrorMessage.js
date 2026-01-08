import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Spacing, Radius, Shadow, Typography } from "../styles/theme";

export default function ErrorMessage({ message, onRetry }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.errorBar, { backgroundColor: colors.error }]} />
      <View style={styles.content}>
        <Text style={[styles.errorText, { color: colors.text }]}>{message}</Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    ...Shadow.subtle,
  },
  errorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    ...Typography.button,
    fontSize: 13,
    color: 'white',
  },
});
