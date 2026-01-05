// src/screens/EmployeeDetailScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import apiService from "../api/apiService";
import { getPermissions } from "../utils/permissions";

const BASE_URL = "http://102.213.182.101:5000";

export default function EmployeeDetailScreen({ route, navigation }) {
  const { employee, user } = route.params || {};

  const perms = getPermissions(user);
  const canEditEmployee = perms.EDIT_EMPLOYEE;
  const canUploadDocs = perms.UPLOAD_EMPLOYEE_DOCS;

  const [data, setData] = useState(employee || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reloadEmployee();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", reloadEmployee);
    return unsubscribe;
  }, [navigation]);

  const reloadEmployee = async () => {
    if (!employee?.id) {
      setLoading(false);
      return;
    }

    try {
      const [empRes, docsRes] = await Promise.allSettled([
        apiService.getEmployee(employee.id),
        apiService.getEmployeeDocuments(employee.id),
      ]);

      const next = { ...(data || {}) };

      if (empRes.status === "fulfilled" && empRes.value?.success) {
        Object.assign(next, empRes.value.employee);
      }

      if (docsRes.status === "fulfilled" && docsRes.value?.success) {
        next.documents = docsRes.value.documents || [];
      } else {
        next.documents = next.documents || [];
      }

      setData(next);
    } catch (e) {
      console.log("Reload failed:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- DOCUMENT ACTIONS ---------- */

  const openDocument = async (doc) => {
    try {
      if (!doc?.id || !doc?.filename) {
        Alert.alert("File error", "Document info is missing.");
        return;
      }

      const token = await apiService.getToken();
      if (!token) {
        Alert.alert("Auth error", "Missing token. Please login again.");
        return;
      }

      const downloadUrl = `${BASE_URL}/api/documents/employee/${doc.id}/download`;
      const localPath = `${FileSystem.documentDirectory}${doc.filename}`;

      const res = await FileSystem.downloadAsync(downloadUrl, localPath, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(res.uri);
        return;
      }

      await Linking.openURL(res.uri);
    } catch (e) {
      console.log("Open document failed:", e);
      Alert.alert("Open failed", "Cannot open this document.");
    }
  };

  const confirmDelete = (doc) => {
    if (!doc?.id) return;

    Alert.alert(
      "Delete document?",
      "This will permanently delete the file.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await apiService.deleteEmployeeDocument(doc.id);

              if (!res?.success) {
                console.log("❌ Delete failed:", res);
                Alert.alert("Error", res?.message || "Delete failed");
                return;
              }

              console.log("✅ Deleted doc:", doc.id);
              reloadEmployee();
            } catch (e) {
              console.log("❌ Delete error:", e);
              Alert.alert("Error", "Delete failed");
            }
          },
        },
      ]
    );
  };

  /* ---------- RENDER ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading employee...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No employee data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* HEADER */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={38} color="#2563eb" />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{data.full_name}</Text>

            {canEditEmployee && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EmployeeEdit", { employee: data })}
              >
                <Ionicons name="create-outline" size={14} color="#2563eb" />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.nationality}>
            {data.nationality || "Nationality not provided"}
          </Text>
        </View>
      </View>

      {/* INFO SECTIONS */}
      <InfoCard title="Job Information" icon="briefcase-outline">
        <Info label="Job Title" value={data.job_title} />
        <Info label="Department" value={data.department?.name} />
      </InfoCard>

      <InfoCard title="Contact Details" icon="call-outline">
        <Info label="Phone" value={data.phone} />
        <Info label="Country" value={data.country} />
        <Info label="State" value={data.state} />
      </InfoCard>

      <InfoCard title="Addresses" icon="home-outline">
        <Info label="Actual Address" value={data.actual_address} />
        <Info label="Mother Country Address" value={data.mother_country_address} />
      </InfoCard>

      <InfoCard title="Identity" icon="id-card-outline">
        <Info label="ID Number" value={data.id_number} />
        <Info label="Birth Date" value={data.birth_date?.substring(0, 10)} />
      </InfoCard>

      {/* DOCUMENTS */}
      <View style={styles.card}>
        <SectionTitle icon="folder-open-outline" title="Documents" />

        {data.documents?.length ? (
          data.documents.map((doc) => (
            <View key={doc.id} style={styles.docItem}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: "row" }}
                onPress={() => openDocument(doc)}
              >
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#2563eb"
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.docTitle}>{doc.filename}</Text>
                  <Text style={styles.docDescription}>
                    {doc.document_type || "document"} • {doc.visibility_type || "private"}
                  </Text>
                </View>
              </TouchableOpacity>

              {canUploadDocs && (
                <TouchableOpacity onPress={() => confirmDelete(doc)} style={{ paddingLeft: 10 }}>
                  <Ionicons name="trash-outline" size={18} color="red" />
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.value}>No documents uploaded</Text>
        )}

        {canUploadDocs && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => navigation.navigate("EmployeeUpload", { employee: data })}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#2563eb" />
            <Text style={styles.uploadText}>Upload Document</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

/* ---------- HELPERS ---------- */

function InfoCard({ title, icon, children }) {
  return (
    <View style={styles.card}>
      <SectionTitle icon={icon} title={title} />
      {children}
    </View>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color="#2563eb" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Info({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "N/A"}</Text>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red" },

  headerCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 25,
    margin: 16,
    borderRadius: 14,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e8edff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 22, fontWeight: "700" },

  editButton: {
    flexDirection: "row",
    backgroundColor: "#e0ecff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editText: { marginLeft: 5, color: "#2563eb", fontWeight: "600" },

  nationality: { marginTop: 6, color: "#6b7280" },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 18,
    borderRadius: 14,
  },

  sectionHeader: { flexDirection: "row", marginBottom: 12, gap: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },

  infoRow: { marginBottom: 12 },
  label: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  value: { fontSize: 15, marginTop: 3 },

  docItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  docTitle: { fontSize: 15, fontWeight: "600", color: "#2563eb" },
  docDescription: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  uploadButton: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "center",
  },
  uploadText: {
    marginLeft: 8,
    color: "#2563eb",
    fontWeight: "700",
  },
});
