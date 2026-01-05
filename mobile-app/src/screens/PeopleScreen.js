import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import apiService from "../api/apiService";
import Card from "../components/Card";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorMessage from "../components/ErrorMessage";

export default function PeopleScreen({ navigation, user, mode = "employees" }) {
  console.log("PEOPLE SCREEN MODE:", mode);
  console.log("PEOPLE SCREEN USER:", user);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const isEmployees = mode === "employees";

  const loadData = async () => {
    try {
      setError("");

      const res = isEmployees
        ? await apiService.getEmployees()
        : await apiService.getCandidates();

      if (res?.success) {
        setData(isEmployees ? res.employees || [] : res.candidates || []);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("Network error — cannot load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [mode]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredData = data.filter((item) => {
    const q = search.toLowerCase();

    if (isEmployees) {
      return (
        (item.full_name || "").toLowerCase().includes(q) ||
        (item.job_title || "").toLowerCase().includes(q) ||
        (item.department?.name || "").toLowerCase().includes(q)
      );
    }

    return (
      (item.full_name || "").toLowerCase().includes(q) ||
      (item.applied_position || "").toLowerCase().includes(q)
    );
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate(
          isEmployees ? "EmployeeDetail" : "CandidateDetail",
          isEmployees ? { employee: item, user } : { candidate: item }
        )
      }
    >
      <Card style={localStyles.item}>
        <View style={localStyles.avatar}>
          <Ionicons
            name={isEmployees ? "person" : "person-outline"}
            size={22}
            color={isEmployees ? "#2563eb" : "#6b7280"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={localStyles.itemTitle}>{item.full_name}</Text>

          {isEmployees ? (
            <>
              <Text style={localStyles.itemSub}>{item.job_title}</Text>
              <Text style={localStyles.itemMeta}>
                {item.department?.name || "No department"}
              </Text>
              {item.phone && (
                <Text style={localStyles.itemMeta}>📞 {item.phone}</Text>
              )}
            </>
          ) : (
            <Text style={localStyles.itemSub}>{item.applied_position}</Text>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingIndicator text={`Loading ${isEmployees ? "employees" : "candidates"}...`} />;
  }

  return (
    <View style={localStyles.container}>
      {/* Header */}
      <View style={localStyles.header}>
        <Text style={localStyles.title}>
          {isEmployees ? "Employees" : "Candidates"}
        </Text>
      </View>

      {/* Search */}
      <View style={localStyles.searchBox}>
        <Ionicons name="search" size={18} color="#6b7280" />
        <TextInput
          style={localStyles.searchInput}
          placeholder={`Search ${isEmployees ? "employees" : "candidates"}...`}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Content */}
      {error ? (
        <ErrorMessage message={error} onRetry={loadData} />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
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
  title: { fontSize: 22, fontWeight: "700", color: "#1f2937" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    height: 44,
  },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 15 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  itemSub: { fontSize: 14, color: "#6b7280" },
  itemMeta: { fontSize: 12, color: "#9ca3af" },
});
