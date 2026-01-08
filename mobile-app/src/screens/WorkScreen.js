import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";

import apiService from "../api/apiService";
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';

/**
 * Work Screen - Leave management and approvals (HR 2026 Redesign)
 */
function deriveAppRole(userRole = "") {
  const r = userRole.toLowerCase();
  if (r.includes("it_manager")) return "admin";
  if (r.includes("manager") || r.includes("director") || r.includes("ceo"))
    return "manager";
  return "employee";
}

export default function WorkScreen({ user, navigation }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("myLeaves");
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const appRole = deriveAppRole(user?.role);
  const canApprove = appRole === "admin" || appRole === "manager";

  const loadData = useCallback(async () => {
    try {
      setError("");
      const requests = [apiService.getLeaves()];
      if (canApprove) requests.push(apiService.getPendingLeaves());

      const responses = await Promise.all(requests);
      const leavesRes = responses[0];
      const pendingRes = responses[1];

      if (leavesRes?.success) setMyLeaves(leavesRes.leaves || []);
      if (pendingRes?.success) setPendingLeaves(pendingRes.leaves || []);
    } catch {
      setError("Network sync failure — check connectivity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canApprove]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApprove = async (id) => {
    try {
      setRefreshing(true);
      await apiService.approveLeave(id);
      loadData();
    } catch (e) {
      console.log("Approve error:", e);
    }
  };

  const handleReject = async (id) => {
    try {
      setRefreshing(true);
      await apiService.rejectLeave(id);
      loadData();
    } catch (e) {
      console.log("Reject error:", e);
    }
  };

  const styles = getStyles(colors);

  const renderLeave = ({ item, showActions }) => (
    <View style={styles.leaveCard}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBox}>
          <Ionicons name="calendar" size={16} color={colors.accent} />
          <Text style={styles.typeText}>{item.leave_type || "Standard Leave"}</Text>
        </View>
        <StatusBadge status={item.status || 'pending'} />
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.employeeName}>{item.employee_name || user?.name || "Staff Member"}</Text>
        <Text style={styles.dateRange}>{item.start_date} → {item.end_date}</Text>
        {item.reason && (
          <Text style={styles.reasonText} numberOfLines={2}>"{item.reason}"</Text>
        )}
      </View>

      {showActions && item.status === 'pending' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]}
            onPress={() => handleApprove(item.id)}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error + '15' }]}
            onPress={() => handleReject(item.id)}
          >
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.screenTitle}>Protocols</Text>
            <Text style={styles.screenSubtitle}>ALGHAITH Leave Management</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "myLeaves" && styles.activeTab]}
            onPress={() => setActiveTab("myLeaves")}
          >
            <Text style={[styles.tabText, activeTab === "myLeaves" && styles.activeTabText]}>My Requests</Text>
          </TouchableOpacity>
          {canApprove && (
            <TouchableOpacity
              style={[styles.tab, activeTab === "approvals" && styles.activeTab]}
              onPress={() => setActiveTab("approvals")}
            >
              <View style={styles.tabWithBadge}>
                <Text style={[styles.tabText, activeTab === "approvals" && styles.activeTabText]}>Approvals</Text>
                {pendingLeaves.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingLeaves.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={activeTab === "myLeaves" ? myLeaves : pendingLeaves}
        keyExtractor={(item) => item.id.toString()}
        renderItem={(props) => renderLeave({ ...props, showActions: activeTab === "approvals" })}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyCenter}>
            <Ionicons name="calendar-outline" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "myLeaves" ? "You haven't requested any time off yet." : "No pending approvals at this time."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    ...Typography.h1,
    fontSize: 20,
    color: colors.text,
  },
  screenSubtitle: {
    ...Typography.subtitle,
    color: colors.textSecondary,
    marginTop: -2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 20,
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: '700',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    backgroundColor: colors.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  leaveCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.accent}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  cardContent: {
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  dateRange: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 13,
    color: colors.text,
    fontStyle: 'italic',
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCenter: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    ...Typography.h2,
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  },
});
