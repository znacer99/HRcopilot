import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing, Radius, Shadow, Typography } from "../styles/theme";
import styles from "../styles/styles";
import apiService from "../api/apiService";
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
    if (r.includes("manager") || r.includes("director") || r.includes("ceo")) return "manager";
    return "employee";
  }

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) return <LoadingIndicator text="Loading enterprise data..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.screenHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.screenTitle}>Portal</Text>
            <Text style={styles.screenSubtitle}>System Overview</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={localStyles.headerAction}>
            <Ionicons name="power-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
      >
        {error ? (
          <ErrorMessage message={error} onRetry={loadStats} />
        ) : (
          <View style={localStyles.statsGrid}>
            {/* BRAND GREETING */}
            <View style={localStyles.welcomeCard}>
              <Text style={localStyles.welcomeUser}>Welcome, {user?.name?.split(' ')[0]}</Text>
              <Text style={localStyles.welcomeDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>

            {/* STATS TILES */}
            <View style={localStyles.tilesRow}>
              {appRole === "admin" && (
                <>
                  <StatTile color={Colors.accent} label="Employees" value={stats?.employees ?? 0} />
                  <StatTile color={Colors.accent} label="Candidates" value={stats?.candidates ?? 0} />
                  <StatTile color={Colors.accent} label="Departments" value={stats?.departments ?? 0} />
                  <StatTile color={Colors.accent} label="Status" value="Live" />
                </>
              )}

              {appRole === "manager" && (
                <>
                  <StatTile color={Colors.accent} label="Team" value={stats?.employees ?? 0} />
                  <StatTile color={Colors.accent} label="Candidates" value={stats?.candidates ?? 0} />
                  <StatTile color={Colors.accent} label="Requests" value={stats?.pending_leaves ?? 0} />
                  <StatTile color={Colors.accent} label="Operations" value="Active" />
                </>
              )}

              {appRole === "employee" && (
                <>
                  <StatTile color={Colors.accent} label="Role" value={user?.role?.substring(0, 10).toUpperCase() ?? "STAFF"} />
                  <StatTile color={Colors.accent} label="Active" value="—" />
                  <StatTile color={Colors.accent} label="Documents" value="—" />
                  <StatTile color={Colors.accent} label="Notifications" value="0" />
                </>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatTile({ color, label, value }) {
  return (
    <View style={localStyles.tile}>
      <View style={localStyles.tileContainer}>
        <Text style={localStyles.tileLabel}>{label}</Text>
        <Text style={localStyles.tileValue}>{value}</Text>
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    padding: Spacing.lg,
  },
  welcomeCard: {
    marginBottom: Spacing.xl,
  },
  welcomeUser: {
    ...Typography.h2,
    fontSize: 24,
  },
  welcomeDate: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  tile: {
    width: '50%',
    padding: Spacing.sm,
  },
  tileContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  tileLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  tileValue: {
    ...Typography.h2,
    fontSize: 20,
    marginBottom: 2,
  },
  tileLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
