import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RoleLayout({
  user,
  header,
  tabs,
  renderScreen,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{header.title}</Text>
          {header.subtitle ? (
            <Text style={styles.subtitle}>{header.subtitle}</Text>
          ) : null}
        </View>

        {onLogout ? (
          <TouchableOpacity onPress={onLogout}>
            <Ionicons name="log-out-outline" size={22} color="#374151" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {renderScreen(activeTab)}
      </View>

      {/* BOTTOM TABS */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={activeTab === tab.key ? "#2563eb" : "#6b7280"}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },

  header: {
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  content: { flex: 1 },

  tabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    height: 64,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: { fontSize: 11, color: "#6b7280" },
  tabLabelActive: { color: "#2563eb", fontWeight: "600" },
});
