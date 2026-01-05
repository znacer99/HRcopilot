import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import apiService from "../api/apiService";
import Card from "../components/Card";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";

/* INLINE ROLE DERIVATION — UI ONLY */
function deriveAppRole(userRole = "") {
  const r = userRole.toLowerCase();

  if (r.includes("it_manager")) return "admin";
  if (r.includes("manager") || r.includes("director") || r.includes("ceo")) {
    return "manager";
  }
  return "employee";
}


export default function ProfileScreen({ onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    try {
      const res = await apiService.getCurrentUser(); // if exists
      if (res?.success) {
        setUser(res.user);
        await AsyncStorage.setItem("user", JSON.stringify(res.user));
        setError("");
      } else {
        const local = await AsyncStorage.getItem("user");
        if (local) setUser(JSON.parse(local));
      }
    } catch {
      const local = await AsyncStorage.getItem("user");
      if (local) setUser(JSON.parse(local));
      else setError("Failed to load profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const appRole = deriveAppRole(user?.role);

  const handleLogout = () => {
    Alert.alert("Logout", "Do you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logoutNow },
    ]);
  };

  const logoutNow = async () => {
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
    if (onLogout) onLogout();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (loading) return <LoadingIndicator text="Loading profile..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProfile} />;

  return (
    <ScrollView
      style={localStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={localStyles.header}>
        <Text style={localStyles.title}>Profile</Text>
      </View>

      {/* BASIC PROFILE — ALL USERS */}
      <Card style={{ alignItems: "center", paddingVertical: 25 }}>
        <View style={localStyles.avatarLarge}>
          <Ionicons name="person" size={40} color="#2563eb" />
        </View>

        <Text style={localStyles.userName}>{user?.name}</Text>
        <Text style={localStyles.userEmail}>{user?.email}</Text>

        <View style={localStyles.roleBadge}>
          <Text style={localStyles.roleText}>{appRole}</Text>
        </View>
      </Card>

      {/* PERSONAL INFO — ALL USERS */}
      <Card>
        <View style={localStyles.infoItem}>
          <Text style={localStyles.infoLabel}>Phone</Text>
          <Text style={localStyles.infoValue}>{user?.phone || "N/A"}</Text>
        </View>

        {(appRole === "manager" || appRole === "admin") && (
          <>
            <View style={localStyles.infoItem}>
              <Text style={localStyles.infoLabel}>Department</Text>
              <Text style={localStyles.infoValue}>
                {user?.department || "N/A"}
              </Text>
            </View>

            <View style={localStyles.infoItem}>
              <Text style={localStyles.infoLabel}>User ID</Text>
              <Text style={localStyles.infoValue}>{user?.id}</Text>
            </View>
          </>
        )}
      </Card>

      {/* SYSTEM INFO — ADMIN ONLY */}
      {appRole === "admin" && (
        <Card>
          <View style={localStyles.infoItem}>
            <Text style={localStyles.infoLabel}>Application</Text>
            <Text style={localStyles.infoValue}>HRcopilot</Text>
          </View>
          <View style={localStyles.infoItem}>
            <Text style={localStyles.infoLabel}>Version</Text>
            <Text style={localStyles.infoValue}>1.0.0</Text>
          </View>
          <View style={localStyles.infoItem}>
            <Text style={localStyles.infoLabel}>Environment</Text>
            <Text style={localStyles.infoValue}>Production</Text>
          </View>
        </Card>
      )}

      <TouchableOpacity style={localStyles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#dc2626" />
        <Text style={localStyles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: { fontSize: 24, fontWeight: "700", color: "#1f2937" },

  avatarLarge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  userEmail: { fontSize: 14, color: "#6b7280", marginBottom: 8 },

  roleBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },

  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: { fontSize: 14, color: "#6b7280" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#1f2937" },

  logoutButton: {
    margin: 16,
    padding: 14,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutButtonText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
