import React from "react";
import { View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getGlobalStyles } from "../styles/styles";

export default function Card({ children, style }) {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return <View style={[globalStyles.card, style]}>{children}</View>;
}
