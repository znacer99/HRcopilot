import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import apiService from "../api/apiService";
import { useTheme } from "../context/ThemeContext";
import { Spacing, Radius, Shadow, Typography } from "../styles/theme";
import Button from '../components/Button';

/**
 * Team Directory Screen - HR 2026 Professional Design
 */
export default function PeopleScreen({ navigation, user, route }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { manage = false } = route.params || {};

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const res = await apiService.getEmployees();
      if (res?.success) {
        setData(res.employees || []);
      } else {
        setError("Synchronization failure");
      }
    } catch (err) {
      setError("Network infrastructure offline");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const roles = ["All", ...new Set(data.filter(item => item.job_title).map(item => item.job_title))].slice(0, 10);

  const filteredData = data.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (item.full_name || "").toLowerCase().includes(q) ||
      (item.job_title || "").toLowerCase().includes(q) ||
      (item.department_name || "").toLowerCase().includes(q);

    const matchesRole = selectedRole === "All" || item.job_title === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getInitials = (name) => {
    return name
      ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
      : "??";
  };

  const styles = getStyles(colors);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("EmployeeDetail", { employee: item, user, manage })}
      activeOpacity={0.7}
      style={styles.cardWrapper}
    >
      <View style={styles.teamCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={styles.employeeName}>{item.full_name}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </View>
          <Text style={styles.jobTitle}>{item.job_title || "Personnel"}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.deptBadge}>
              <Text style={styles.deptText}>{item.department_name || "General"}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'active' || !item.status ? colors.success : colors.warning }]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.screenTitle}>Personnel</Text>
            <Text style={styles.screenSubtitle}>ALGHAITH Group Directory</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search assets inside ALGHAITH Group..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          data={roles}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(r) => r}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedRole(item)}
              style={[styles.filterChip, selectedRole === item && styles.activeChip]}
            >
              <Text style={[styles.filterText, selectedRole === item && styles.activeFilterText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingMsg}>Syncing directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>No matching personnel</Text>
              <Text style={styles.emptySubtitle}>Adjust your filters or search criteria.</Text>
            </View>
          }
        />
      )}

      {manage && (
        <View style={styles.footer}>
          <Button
            title="Register Employee"
            icon="user-plus"
            variant="primary"
            onPress={() => navigation.navigate("EmployeeEdit")}
          />
        </View>
      )}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingMsg: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  screenTitle: {
    ...Typography.h2,
    color: colors.text,
  },
  screenSubtitle: {
    ...Typography.subtitle,
    color: colors.textSecondary,
    marginTop: -2,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  filterList: {
    paddingHorizontal: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  activeChip: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}15`,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: colors.accent,
    fontWeight: '800',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.subtle,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employeeName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  jobTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deptBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deptText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Shadow.medium,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    ...Typography.h2,
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
