import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { Spacing, Typography } from "../styles/theme";

export default function LoadingIndicator({ text = "Loading..." }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
      {text ? (
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{text}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
    fontWeight: '600',
  },
});
