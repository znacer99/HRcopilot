import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import apiService from "../api/apiService";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";

/**
 * Team List Screen - Redesigned for a premium, professional experience
 */
export default function PeopleScreen({ navigation, user, route }) {
  const { manage = false } = route.params || {};

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");

  const loadData = async () => {
    try {
      setError("");
      const res = await apiService.getEmployees();
      if (res?.success) {
        setData(res.employees || []);
      } else {
        setError("Failed to load employees");
      }
    } catch (err) {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Derive unique roles for filtering
  const roles = ["All", ...new Set(data.map(item => item.job_title).filter(Boolean))].slice(0, 10);

  const filteredData = data.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (item.full_name || "").toLowerCase().includes(q) ||
      (item.job_title || "").toLowerCase().includes(q) ||
      (item.department?.name || "").toLowerCase().includes(q);

    const matchesRole = selectedRole === "All" || item.job_title === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getInitials = (name) => {
    return name
      ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
      : "??";
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("EmployeeDetail", { employee: item, user, manage })
      }
      activeOpacity={0.7}
      style={styles.cardWrapper}
    >
      <View style={styles.teamCard}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.employeeName}>{item.full_name}</Text>
          <Text style={styles.jobTitle}>{item.job_title || "Staff"}</Text>
          <View style={styles.deptBadge}>
            <Text style={styles.deptText}>{item.department?.name || "Other"}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingIndicator text="Syncing..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {manage && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>Directory</Text>
            <Text style={styles.subTitle}>{data.length} members</Text>
          </View>
          {manage && (
            <TouchableOpacity
              onPress={() => navigation.navigate("EmployeeEdit")}
              style={styles.addBtn}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* SEARCH BOX */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search directory..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* ROLE FILTER PILLS */}
        <View style={styles.filterSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={roles}
            keyExtractor={(i) => i}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedRole(item)}
                style={[
                  styles.filterPill,
                  selectedRole === item && styles.filterPillActive,
                ]}
              >
                <Text style={[
                  styles.filterText,
                  selectedRole === item && styles.filterTextActive
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/* TEAM LIST */}
      {error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  iconBtn: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: 'white',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  cardContent: {
    flex: 1,
  },
  employeeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  deptBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  deptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  }
});
