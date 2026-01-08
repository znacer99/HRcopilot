import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import { Spacing, Radius, Shadow, Typography } from "../styles/theme";
import apiService from "../api/apiService";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";

export default function HomeScreen({ user, onLogout, navigation }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
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
        setError("Enterprise synchronization suspended");
      }
    } catch {
      setError("Network bypass detected — verify connection");
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

  const styles = getStyles(colors);

  if (loading) return <LoadingIndicator text="Initializing secure portal..." />;

  const pendingLeaves = stats?.pending_leaves || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={[styles.screenHeader, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerBranding}>
            <Image
              source={require('../../assets/images/alghaith_logo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.screenTitle}>ALGHAITH</Text>
              <Text style={styles.screenSubtitle}>International Group • Portal</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleTheme} style={styles.headerAction} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onLogout} style={styles.headerAction} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="power-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <ErrorMessage message={error} onRetry={loadStats} />
        ) : (
          <View style={styles.mainGrid}>
            {/* Welcome Banner */}
            <View style={styles.welcomeRow}>
              <View>
                <Text style={styles.welcomeUser}>Greetings, {user?.name?.split(' ')[0]}</Text>
                <Text style={styles.welcomeDate}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {appRole !== 'employee' && (
                <View style={styles.statusIndicator}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.statusLabel}>Live Assets</Text>
                </View>
              )}
            </View>

            {/* Critical Alerts for Management */}
            {(appRole === "admin" || appRole === "manager") && pendingLeaves > 0 && (
              <TouchableOpacity
                style={styles.alertBanner}
                onPress={() => navigation.navigate("Work")}
                activeOpacity={0.9}
              >
                <Ionicons name="notifications" size={20} color="white" />
                <Text style={styles.alertText}>
                  {pendingLeaves} Requests awaiting protocol resolution
                </Text>
                <Ionicons name="chevron-forward" size={16} color="white" />
              </TouchableOpacity>
            )}

            {/* Operational Stats Grid */}
            <View style={styles.tilesRow}>
              {appRole === "admin" && (
                <>
                  <StatTile
                    colors={colors}
                    label="Personnel"
                    value={stats?.employees ?? 0}
                    icon="people-outline"
                    onPress={() => navigation.navigate("Staff")}
                  />
                  <StatTile
                    colors={colors}
                    label="Pipeline"
                    value={stats?.candidates ?? 0}
                    icon="trending-up-outline"
                    onPress={() => navigation.navigate("Recruitment")}
                  />
                  <StatTile
                    colors={colors}
                    label="Units"
                    value={stats?.departments ?? 0}
                    icon="business-outline"
                    onPress={() => navigation.navigate("Gov")}
                  />
                  <StatTile
                    colors={colors}
                    label="Security"
                    value="Verified"
                    icon="shield-checkmark-outline"
                    onPress={() => Alert.alert("System Security", "ALGHAITH Enterprise sub-systems are operating within normal parameters.")}
                  />
                </>
              )}

              {appRole === "manager" && (
                <>
                  <StatTile
                    colors={colors}
                    label="Team Assets"
                    value={stats?.employees ?? 0}
                    icon="people-outline"
                    onPress={() => navigation.navigate("Staff")}
                  />
                  <StatTile
                    colors={colors}
                    label="Queue"
                    value={stats?.pending_leaves ?? 0}
                    icon="time-outline"
                    onPress={() => navigation.navigate("Work")}
                  />
                  <StatTile
                    colors={colors}
                    label="Talent"
                    value={stats?.candidates ?? 0}
                    icon="rocket-outline"
                    onPress={() => navigation.navigate("Recruitment")}
                  />
                  <StatTile
                    colors={colors}
                    label="Protocols"
                    value="Secure"
                    icon="lock-closed-outline"
                    onPress={() => navigation.navigate("Requests")}
                  />
                </>
              )}

              {appRole === "employee" && (
                <>
                  <StatTile
                    colors={colors}
                    label="Service ID"
                    value={`AG-${user?.id?.toString().padStart(4, '0')}`}
                    icon="finger-print-outline"
                    onPress={() => navigation.navigate("Profile")}
                  />
                  <StatTile
                    colors={colors}
                    label="Dossier"
                    value="Updated"
                    icon="folder-open-outline"
                    onPress={() => navigation.navigate("Documents")}
                  />
                  <StatTile
                    colors={colors}
                    label="Support Hub"
                    value="Secure"
                    icon="chatbubbles-outline"
                    onPress={() => navigation.navigate("Requests")}
                  />
                  <StatTile
                    colors={colors}
                    label="Integrity"
                    value="Verified"
                    icon="shield-outline"
                    onPress={() => Alert.alert("Account Status", "ALGHAITH Security: Your credentials are authenticated and secure.")}
                  />
                </>
              )}
            </View>

            {/* Team Pulse Activity Feed */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Group Pulse</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>Analytics</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.feedCard}>
              <PulseItem
                colors={colors}
                icon="airplane-outline"
                color="#3b82f6"
                title="Staff Availability"
                desc="Operational levels adjusted for 3 resources on leave."
              />
              <PulseItem
                colors={colors}
                icon="ribbon-outline"
                color="#f59e0b"
                title="Service Milestones"
                desc="Executive commendation for Michael S. (4 years)."
              />
              <PulseItem
                colors={colors}
                icon="sparkles-outline"
                color="#10b981"
                title="New Onboarding"
                desc="2 Technical assets integrated into Engineering unit."
                isLast
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const StatTile = ({ colors, label, value, icon, onPress }) => {
  const styles = getStyles(colors);
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.tileContainer}>
        <View style={styles.tileHeader}>
          <Ionicons name={icon} size={20} color={colors.accent} />
          <Ionicons name="arrow-forward" size={12} color={colors.border} />
        </View>
        <Text style={styles.tileValue}>{value}</Text>
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const PulseItem = ({ colors, icon, color, title, desc, isLast }) => {
  const styles = getStyles(colors);
  return (
    <View style={[styles.pulseItem, isLast && { borderBottomWidth: 0 }]}>
      <View style={[styles.pulseIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.pulseContent}>
        <Text style={styles.pulseTitle}>{title}</Text>
        <Text style={styles.pulseDesc}>{desc}</Text>
      </View>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  screenTitle: {
    ...Typography.h2,
    color: colors.text,
    fontSize: 18,
  },
  screenSubtitle: {
    ...Typography.subtitle,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainGrid: {
    padding: Spacing.lg,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeUser: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  welcomeDate: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: Radius.lg,
    marginBottom: 20,
    gap: 12,
    ...Shadow.medium,
  },
  alertText: {
    flex: 1,
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  tilesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    width: '50%',
    padding: 0,
    marginBottom: Spacing.md,
  },
  tileContainer: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    ...Shadow.subtle,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  viewAll: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
  },
  feedCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  pulseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pulseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pulseContent: {
    flex: 1,
  },
  pulseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  pulseDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
