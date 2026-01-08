import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import apiService from "../api/apiService";
import { useTheme } from "../context/ThemeContext";
import { Spacing, Radius, Shadow, Typography } from "../styles/theme";

function deriveAppRole(userRole = "") {
  const r = userRole.toLowerCase();
  if (r.includes("it_manager")) return "IT Administrator";
  if (r.includes("manager") || r.includes("director") || r.includes("ceo")) {
    return "Management Executive";
  }
  return "Standard Personnel";
}

export default function ProfileScreen({ onLogout }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const res = await apiService.getCurrentUser();
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
      else setError("Profile synchronization suspended");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert("Terminating Session", "Are you certain you wish to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logoutNow },
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

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const styles = getStyles(colors);

  if (loading && !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const roleTitle = deriveAppRole(user?.role);
  const employee = user?.employee;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/alghaith_logo.jpg')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.screenTitle}>Dossier</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <View style={styles.heroSection}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarLabel}>{getInitials(user?.name)}</Text>
            <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || "Authenticating..."}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.accent} />
            <Text style={styles.roleText}>{roleTitle}</Text>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          {/* Module 1: Employment Details */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Operational Protocol</Text>
            <ProfileRow
              colors={colors}
              icon="business-outline"
              label="Organization"
              value="ALGHAITH International Group"
            />
            <ProfileRow
              colors={colors}
              icon="briefcase-outline"
              label="Designation"
              value={employee?.job_title || user?.position || "Personnel"}
            />
            <ProfileRow
              colors={colors}
              icon="map-outline"
              label="Department"
              value={employee?.department || "Corporate HQ"}
            />
          </View>

          {/* Module 2: Personal Identity */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Personal Identity</Text>
            <ProfileRow
              colors={colors}
              icon="finger-print-outline"
              label="Identity Reference"
              value={employee?.id_number || "Not Registered"}
              subValue={employee?.id_type}
            />
            <ProfileRow
              colors={colors}
              icon="flag-outline"
              label="Nationality"
              value={employee?.nationality || "Global Citizen"}
            />
            <ProfileRow
              colors={colors}
              icon="calendar-outline"
              label="Date of Birth"
              value={employee?.birth_date || "—"}
            />
          </View>

          {/* Module 3: Contact & Residency */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Contact & Residency</Text>
            <ProfileRow
              colors={colors}
              icon="call-outline"
              label="Secure Mobile"
              value={user?.phone || employee?.phone || "Not Verified"}
            />
            <ProfileRow
              colors={colors}
              icon="location-outline"
              label="Operational Base"
              value={`${employee?.state || 'NY'}, ${employee?.country || 'USA'}`}
            />
            <ProfileRow
              colors={colors}
              icon="home-outline"
              label="Residency Address"
              value={employee?.actual_address || "Confidential"}
            />
          </View>

          {/* Module 4: Emergency Protocol */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Emergency Protocol</Text>
            <View style={styles.emergencyBox}>
              <Ionicons name="alert-circle" size={24} color={colors.error} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.emergencyTitle}>No emergency contact on file</Text>
                <Text style={styles.emergencyDesc}>Please update your emergency details for safety compliance.</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>System Configuration</Text>
            <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
              <View style={styles.itemIcon}>
                <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color={colors.text} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                Interface: {isDarkMode ? "Obsidian Dark" : "Crystal Light"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.itemIcon}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.text} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Security Credentials</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10 }}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.logoutText}>Relinquish Session</Text>
          </TouchableOpacity>

          <Text style={styles.appVersion}>ALGHAITH INTERNATIONAL GROUP • V2026.2.0</Text>
        </View>
      </ScrollView>

      {/* Floating Action Button for Updates */}
      <TouchableOpacity style={styles.fab} onPress={() => Alert.alert("Request Update", "Update request has been sent to ALGHAITH HR for verification.")} activeOpacity={0.9} hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}>
        <Ionicons name="create" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const ProfileRow = ({ colors, icon, label, value, subValue }) => {
  const styles = getStyles(colors);
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value}</Text>
        {!!subValue && <Text style={styles.itemSubValue}>{subValue}</Text>}
      </View>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  screenTitle: {
    ...Typography.h2,
    color: colors.text,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarBox: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.medium,
    marginBottom: 20,
    position: 'relative',
  },
  avatarLabel: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: colors.accent,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: `${colors.accent}15`,
    borderWidth: 1,
    borderColor: `${colors.accent}40`,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionWrap: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  itemSubValue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emergencyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}05`,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${colors.error}20`,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  emergencyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.error}10`,
    padding: 20,
    borderRadius: Radius.xl,
    marginTop: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '800',
  },
  appVersion: {
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 40,
    fontSize: 12,
    fontWeight: '700',
    color: colors.border,
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.medium,
  },
});
