import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import styles from "../styles/styles";

export default function LoadingIndicator({ text = "Loading..." }) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}
