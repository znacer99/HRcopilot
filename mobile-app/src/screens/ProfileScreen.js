import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import apiService from "../api/apiService";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";
import { Colors, Spacing, Radius, Shadow, Typography } from "../styles/theme";
import styles from "../styles/styles";

function deriveAppRole(userRole = "") {
  const r = userRole.toLowerCase();
  if (r.includes("it_manager")) return "Admin";
  if (r.includes("manager") || r.includes("director") || r.includes("ceo")) {
    return "Management";
  }
  return "Staff";
}

export default function ProfileScreen({ onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
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
      else setError("Failed to synchronize profile");
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
    Alert.alert("Sign Out", "Are you sure you want to end your session?", [
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
    return name
      ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
      : "??";
  };

  if (loading) return <LoadingIndicator text="Syncing..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProfile} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={localStyles.header} edges={['top']}>
        <View style={localStyles.topNav}>
          <Text style={styles.screenTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={localStyles.navIconBtn}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.screen}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={localStyles.heroSection}>
          <View style={localStyles.avatarLarge}>
            <Text style={localStyles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={localStyles.heroName}>{user?.name}</Text>
          <Text style={localStyles.heroEmail}>{user?.email}</Text>
          <View style={localStyles.roleBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.accent} style={{ marginRight: 6 }} />
            <Text style={localStyles.roleText}>{appRole}</Text>
          </View>
        </View>

        <View style={localStyles.modulesContainer}>
          <ProfileModule title="Personal" icon="person-outline" color={Colors.accent}>
            <InfoItem label="ID" value={user?.id} />
            <InfoItem label="Contact" value={user?.phone || "Not set"} />
          </ProfileModule>

          {appRole !== "Staff" && (
            <ProfileModule title="Work" icon="briefcase-outline" color={Colors.success}>
              <InfoItem label="Department" value={user?.department || "Operations"} />
              <InfoItem label="Access" value={user?.role?.toUpperCase()} />
            </ProfileModule>
          )}

          <ProfileModule title="Settings" icon="settings-outline" color={Colors.textSecondary}>
            <InfoItem label="Version" value="2.0.1" />
            <InfoItem label="Status" value="Secure" />
          </ProfileModule>

          <TouchableOpacity style={localStyles.logoutBtn} onPress={handleLogout}>
            <Text style={localStyles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileModule({ title, icon, color, children }) {
  return (
    <View style={localStyles.moduleCard}>
      <View style={localStyles.cardHeader}>
        <View style={[localStyles.cardIconBox, { backgroundColor: `${color}10` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={localStyles.cardTitle}>{title}</Text>
      </View>
      <View style={localStyles.cardBody}>{children}</View>
    </View>
  );
}

function InfoItem({ label, value }) {
  return (
    <View style={localStyles.infoRow}>
      <Text style={localStyles.infoLabel}>{label}</Text>
      <Text style={localStyles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    ...Shadow.subtle,
    marginBottom: Spacing.xl,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  heroName: {
    ...Typography.h2,
    fontSize: 22,
  },
  heroEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modulesContainer: {
    paddingHorizontal: Spacing.lg,
  },
  moduleCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadow.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    gap: 8,
  },
  logoutBtnText: {
    ...Typography.button,
    color: 'white',
  },
});
