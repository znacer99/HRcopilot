import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import apiService from "../api/apiService";
import Card from "../components/Card";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";

export default function HomeScreen({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const appRole = deriveAppRole(user?.role);

  const loadStats = async () => {
    try {
      const result = await apiService.getDashboardStats();
      if (result.success) {
        setStats(result.stats);
      } else {
        setError("Failed to load dashboard stats");
      }
    } catch {
      setError("Network error — check connection");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  function deriveAppRole(userRole = "") {
    const r = userRole.toLowerCase();
  
    if (r.includes("it_manager")) return "admin";
    if (r.includes("manager") || r.includes("director") || r.includes("ceo")) {
      return "manager";
    }
    return "employee";
  }
  
  

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) return <LoadingIndicator text="Loading dashboard..." />;

  return (
    <ScrollView
      style={localStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View style={localStyles.header}>
        <View style={localStyles.headerRow}>
          <View>
            <Text style={localStyles.title}>Dashboard</Text>
            <Text style={localStyles.subtitle}>Overview</Text>
          </View>
          <Ionicons
            name="log-out-outline"
            size={24}
            color="#374151"
            onPress={onLogout}
          />
        </View>
      </View>

      {error ? (
        <ErrorMessage message={error} onRetry={loadStats} />
      ) : (
        <View style={localStyles.statsGrid}>
          {/* ADMIN */}
          {appRole === "admin" && (
            <>
              <StatCard icon="people" color="#2563eb" label="Employees" value={stats?.employees ?? 0} />
              <StatCard icon="person-add" color="#7c3aed" label="Candidates" value={stats?.candidates ?? 0} />
              <StatCard icon="business" color="#0284c7" label="Departments" value={stats?.departments ?? 0} />
              <StatCard icon="pulse" color="#059669" label="System Activity" value="—" />
            </>
          )}

          {/* MANAGER */}
          {appRole === "manager" && (
            <>
              <StatCard icon="people" color="#2563eb" label="Employees" value={stats?.employees ?? 0} />
              <StatCard icon="person-add" color="#7c3aed" label="Candidates" value={stats?.candidates ?? 0} />
              <StatCard icon="document-text" color="#d97706" label="Pending Leaves" value={stats?.pending_leaves ?? 0} />
              <StatCard icon="time" color="#059669" label="Recent Activity" value="—" />
            </>
          )}

          {/* EMPLOYEE */}
          {appRole === "employee" && (
            <>
              <StatCard icon="person" color="#2563eb" label="My Role" value={user?.role ?? "—"} />
              <StatCard icon="calendar" color="#d97706" label="Leave Balance" value="—" />
              <StatCard icon="folder" color="#0284c7" label="My Documents" value="—" />
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ icon, color, label, value }) {
  return (
    <Card style={localStyles.cardItem}>
      <View style={[localStyles.iconBox, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={26} color={color} />
      </View>
      <Text style={localStyles.statNumber}>{value}</Text>
      <Text style={localStyles.statLabel}>{label}</Text>
    </Card>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: { fontSize: 24, fontWeight: "700", color: "#1f2937" },
  subtitle: { color: "#6b7280", marginTop: 2 },

  statsGrid: {
    padding: 16,
    gap: 14,
  },
  cardItem: {
    alignItems: "center",
    padding: 18,
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
});
