import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import apiService, { BASE_URL } from "../api/apiService";
import { getPermissions } from "../utils/permissions";

const { width } = Dimensions.get('window');

/**
 * Employee Detail Screen - Premium Redesign
 * Features a hero header and organized information modules
 */
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
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#f87171" />
        <Text style={styles.errorText}>No employee data found.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getInitials = (name) => {
    return name
      ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
      : "??";
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIconBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Details</Text>
          {canEditEmployee ? (
            <TouchableOpacity
              onPress={() => navigation.navigate("EmployeeEdit", { employee: data })}
              style={styles.navIconBtn}
            >
              <Ionicons name="create-outline" size={24} color="#2563eb" />
            </TouchableOpacity>
          ) : <View style={{ width: 44 }} />}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getInitials(data.full_name)}</Text>
          </View>
          <Text style={styles.heroName}>{data.full_name}</Text>
          <Text style={styles.heroRole}>{data.job_title || "Team Member"}</Text>
          <View style={styles.heroBadge}>
            <Ionicons name="business" size={14} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.heroDept}>{data.department?.name || "Unassigned"}</Text>
          </View>
        </View>

        {/* INFO MODULES */}
        <View style={styles.modulesContainer}>
          <InfoCard title="Job Details" icon="briefcase" color="#3b82f6">
            <Info label="Current Role" value={data.job_title} icon="star-outline" />
            <Info label="Organization Unit" value={data.department?.name} icon="layers-outline" />
            <Info label="Nationality" value={data.nationality} icon="flag-outline" />
          </InfoCard>

          <InfoCard title="Contact Channels" icon="call" color="#10b981">
            <Info label="Primary Phone" value={data.phone} icon="phone-portrait-outline" isLink onPress={() => Linking.openURL(`tel:${data.phone}`)} />
            <Info label="Region" value={data.country} icon="earth-outline" />
            <Info label="State/Province" value={data.state} icon="map-outline" />
          </InfoCard>

          <InfoCard title="Identity & Legal" icon="id-card" color="#7c3aed">
            <Info label="Social ID / Passport" value={data.id_number} icon="barcode-outline" />
            <Info label="Date of Birth" value={data.birth_date?.substring(0, 10)} icon="calendar-outline" />
          </InfoCard>

          <InfoCard title="Address Directory" icon="home" color="#f59e0b">
            <Info label="Residence" value={data.actual_address} icon="location-outline" multiline />
            <Info label="Origin Address" value={data.mother_country_address} icon="airplane-outline" multiline />
          </InfoCard>

          {/* DOCUMENTS SECTION */}
          <View style={styles.documentSet}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="folder-open" size={20} color="#2563eb" />
              </View>
              <Text style={styles.cardTitle}>Document Vault</Text>
            </View>

            {data.documents?.length ? (
              data.documents.map((doc) => (
                <View key={doc.id} style={styles.docItem}>
                  <TouchableOpacity
                    style={styles.docMain}
                    onPress={() => openDocument(doc)}
                  >
                    <View style={styles.fileIconBox}>
                      <Ionicons name="document-text" size={24} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docTitle} numberOfLines={1}>{doc.filename}</Text>
                      <Text style={styles.docMeta}>
                        {doc.document_type || "File"} • {doc.visibility_type || "Private"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {canUploadDocs && (
                    <TouchableOpacity onPress={() => confirmDelete(doc)} style={styles.docDelete}>
                      <Ionicons name="trash-outline" size={20} color="#f87171" />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyDocs}>
                <Ionicons name="cloud-offline-outline" size={32} color="#d1d5db" />
                <Text style={styles.emptyDocsText}>No digital documents found</Text>
              </View>
            )}

            {canUploadDocs && (
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => navigation.navigate("EmployeeUpload", { employee: data })}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="white" />
                <Text style={styles.uploadBtnText}>Add Document</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* DANGER ZONE */}
          {route.params?.manage && (
            <View style={styles.dangerZone}>
              <TouchableOpacity
                style={styles.deleteRecordBtn}
                onPress={() => {
                  Alert.alert(
                    "Remove Employee Record",
                    `This will permanently remove ${data.full_name} from the system.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete Record",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            const res = await apiService.deleteEmployee(data.id);
                            if (res.success) {
                              Alert.alert("Success", "Record removed.");
                              navigation.goBack();
                            }
                          } catch (err) {
                            Alert.alert("Error", "Failed to remove record.");
                          }
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="trash-bin-outline" size={20} color="white" />
                <Text style={styles.deleteRecordText}>Archive Employee Record</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- HELPERS ---------- */

function InfoCard({ title, icon, color, children }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBox, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>
        {children}
      </View>
    </View>
  );
}

function Info({ label, value, icon, isLink, onPress, multiline }) {
  return (
    <TouchableOpacity
      style={styles.infoRow}
      disabled={!isLink}
      onPress={onPress}
    >
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={18} color="#94a3b8" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[
            styles.infoValue,
            isLink && styles.linkValue,
            multiline && { lineHeight: 22 }
          ]}
        >
          {value || "Not Provided"}
        </Text>
      </View>
      {isLink && <Ionicons name="external-link-outline" size={14} color="#2563eb" />}
    </TouchableOpacity>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  headerSafeArea: {
    backgroundColor: 'white',
    // borderBottomWidth: 1,
    // borderBottomColor: '#f1f5f9',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'white' },
  loadingText: { marginTop: 16, color: '#64748b', fontWeight: '500' },
  errorText: { fontSize: 18, color: "#64748b", marginTop: 20 },
  retryBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2563eb', borderRadius: 12 },
  retryText: { color: 'white', fontWeight: '700' },

  heroSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 24,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eff6ff',
    borderWidth: 4,
    borderColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2563eb',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  heroRole: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  heroDept: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'uppercase',
  },

  modulesContainer: {
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardBody: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconBox: {
    width: 18,
    marginTop: 2,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  linkValue: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },

  documentSet: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  docMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  docMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  docDelete: {
    padding: 8,
  },
  emptyDocs: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyDocsText: {
    marginTop: 10,
    color: '#94a3b8',
    fontSize: 14,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  uploadBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },

  dangerZone: {
    marginTop: 8,
    marginBottom: 40,
  },
  deleteRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 18,
    justifyContent: 'center',
    gap: 10,
  },
  deleteRecordText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
