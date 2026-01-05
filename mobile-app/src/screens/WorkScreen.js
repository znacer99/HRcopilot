import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import apiService from "../api/apiService";
import Card from "../components/Card";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";

/**
 * ROLE DERIVATION — FINAL
 * it_manager = ADMIN
 */
function deriveAppRole(userRole = "") {
  const r = userRole.toLowerCase();

  if (r.includes("it_manager")) return "admin";
  if (r.includes("manager") || r.includes("director") || r.includes("ceo"))
    return "manager";

  return "employee";
}

export default function WorkScreen({ user }) {
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

      const [leavesRes, pendingRes] = await Promise.all(requests);

      if (leavesRes?.success) setMyLeaves(leavesRes.leaves || []);
      if (pendingRes?.success) setPendingLeaves(pendingRes.leaves || []);
    } catch {
      setError("Network error — cannot load work data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canApprove]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApprove = async (id) => {
    try {
      await apiService.approveLeave(id);
      loadData();
    } catch (e) {
      console.log("Approve error:", e);
    }
  };

  const handleReject = async (id) => {
    try {
      await apiService.rejectLeave(id);
      loadData();
    } catch (e) {
      console.log("Reject error:", e);
    }
  };

  const renderLeave = ({ item, showActions }) => (
    <Card style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>
          {item.employee_name || "Employee"}
        </Text>
        <Text style={styles.itemSub}>
          {item.leave_type || "Leave"} • {item.status || "Status"}
        </Text>
        <Text style={styles.itemMeta}>
          {item.start_date} → {item.end_date}
        </Text>
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => handleApprove(item.id)}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleReject(item.id)}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  if (loading) return <LoadingIndicator text="Loading work data..." />;

  const data = activeTab === "myLeaves" ? myLeaves : pendingLeaves;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Work</Text>
        <Text style={styles.subtitle}>Leaves & Approvals</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "myLeaves" && styles.activeTab,
          ]}
          onPress={() => setActiveTab("myLeaves")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "myLeaves" && styles.activeTabText,
            ]}
          >
            My Leaves ({myLeaves.length})
          </Text>
        </TouchableOpacity>

        {canApprove && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "pending" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("pending")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" && styles.activeTabText,
              ]}
            >
              Pending ({pendingLeaves.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={(props) =>
            renderLeave({
              ...props,
              showActions: canApprove && activeTab === "pending",
            })
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#1f2937" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },

  tabs: { flexDirection: "row", backgroundColor: "#fff" },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  activeTab: { borderBottomColor: "#2563eb" },
  tabText: { fontSize: 14, color: "#6b7280" },
  activeTabText: { color: "#2563eb", fontWeight: "600" },

  item: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  itemSub: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  itemMeta: { fontSize: 12, color: "#9ca3af", marginTop: 4 },

  actions: {
    flexDirection: "row",
    marginLeft: 10,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
  },
  approveBtn: { backgroundColor: "#16a34a" },
  rejectBtn: { backgroundColor: "#dc2626" },
});
