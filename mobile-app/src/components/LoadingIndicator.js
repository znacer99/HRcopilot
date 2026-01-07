import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import styles from "../styles/styles";

import { Colors } from "../styles/theme";

export default function LoadingIndicator({ text = "Loading..." }) {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}
