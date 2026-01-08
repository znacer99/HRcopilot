import React, { useState, useEffect, useCallback } from "react";
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
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import apiService, { BASE_URL } from "../api/apiService";
import documentEngine from "../utils/documentEngine";
import { getPermissions } from "../utils/permissions";
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

/**
 * Employee Detail Screen - HR 2026 Redesign
 * Features a hero header and organized information modules
 */
export default function EmployeeDetailScreen({ route, navigation }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { employee, user } = route.params || {};

  const perms = getPermissions(user);
  const isPrivileged = ['it_manager', 'general_director', 'manager'].includes(user?.role?.toLowerCase());
  const canEditEmployee = perms.EDIT_EMPLOYEE;
  const canUploadDocs = perms.UPLOAD_EMPLOYEE_DOCS;

  const [data, setData] = useState(employee || null);
  const [loading, setLoading] = useState(true);

  const reloadEmployee = useCallback(async () => {
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
  }, [employee?.id]);

  useEffect(() => {
    reloadEmployee();
  }, [reloadEmployee]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", reloadEmployee);
    return unsubscribe;
  }, [navigation, reloadEmployee]);

  /* ---------- DOCUMENT ACTIONS ---------- */
  const openDocument = async (doc) => {
    await documentEngine.downloadAndPreview('employee', doc.id, doc.filename);
  };

  const deleteDocument = (docId) => {
    Alert.alert("Remove Document", "Are you sure? This action is permanent.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await apiService.deleteDocument(docId);
            reloadEmployee();
          } catch (e) {
            Alert.alert("Error", "Failed to remove document.");
          }
        },
      },
    ]);
  };

  /* ---------- RENDER HELPERS ---------- */

  const ModuleCard = ({ title, icon, children, color = colors.primary }) => (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );

  const InfoRow = ({ label, value, icon, link }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        {link ? (
          <TouchableOpacity onPress={() => Linking.openURL(link)}>
            <Text style={[styles.infoValue, styles.linkValue, { color: colors.accent }]}>{value || "Not Set"}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.infoValue}>{value || "Not Set"}</Text>
        )}
      </View>
    </View>
  );

  const styles = getStyles(colors);

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const initials = (data?.full_name || "??")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={[styles.topNav, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>ALGHAITH Profile</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={[styles.statusIndicator, { backgroundColor: data?.status === 'active' || !data?.status ? colors.success : colors.warning }]} />
          </View>
          <Text style={styles.heroName}>{data?.full_name}</Text>
          <Text style={styles.heroRole}>{data?.job_title || "ALGHAITH Personnel"}</Text>

          <View style={styles.heroBadge}>
            <Text style={styles.heroDept}>{data?.department_name || "CENTRAL OPERATIONS"}</Text>
          </View>

          {canEditEmployee && (
            <TouchableOpacity
              onPress={() => navigation.navigate("EmployeeEdit", { employee: data })}
              style={styles.editHeroBtn}
            >
              <Ionicons name="create-outline" size={18} color={colors.accent} />
              <Text style={styles.editHeroText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.modulesContainer}>
          <ModuleCard title="Contact Information" icon="call-outline" color={colors.accent}>
            <InfoRow label="Email Address" value={data?.email} icon="mail-outline" link={`mailto:${data?.email}`} />
            <InfoRow label="Phone Number" value={data?.phone} icon="phone-portrait-outline" link={`tel:${data?.phone}`} />
          </ModuleCard>

          <ModuleCard title="Employment Details" icon="briefcase-outline" color={colors.primary}>
            <InfoRow label="Hire Date" value={data?.hire_date} icon="calendar-outline" />
            <InfoRow label="Employee ID" value={`#${data?.id || "---"}`} icon="id-card-outline" />
            {data?.user ? (
              <TouchableOpacity
                style={styles.systemLink}
                onPress={() => navigation.navigate('UserEdit', { userId: data.user.id })}
              >
                <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
                <Text style={styles.systemLinkText}>Linked to System Account ({data.user.email})</Text>
              </TouchableOpacity>
            ) : (
              <InfoRow label="Access Account" value="None Linked" icon="shield-outline" />
            )}
            <InfoRow label="Base Salary" value={data?.salary ? `$${Number(data.salary).toLocaleString()}` : "Confidential"} icon="cash-outline" />
          </ModuleCard>

          <View style={styles.documentSet}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconBox, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="folder-open" size={20} color={colors.warning} />
              </View>
              <Text style={styles.cardTitle}>Personnel Documents</Text>
            </View>

            {data?.documents?.length > 0 ? (
              data.documents.map((doc) => (
                <View key={doc.id} style={styles.docItem}>
                  <TouchableOpacity style={styles.docMain} onPress={() => openDocument(doc)}>
                    <View style={styles.fileIconBox}>
                      <Ionicons
                        name={doc.document_type?.toLowerCase().includes('pdf') ? 'document-text' : 'document'}
                        size={24}
                        color={colors.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docTitle} numberOfLines={1}>{doc.filename}</Text>
                      <Text style={styles.docMeta}>{doc.document_type} • {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Historical'}</Text>
                    </View>
                  </TouchableOpacity>
                  {canUploadDocs && (
                    <TouchableOpacity onPress={() => deleteDocument(doc.id)} style={styles.docDelete}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyDocs}>
                <Ionicons name="file-tray-outline" size={48} color={colors.border} />
                <Text style={styles.emptyDocsText}>No documents in file.</Text>
              </View>
            )}

            {canUploadDocs && (
              <TouchableOpacity
                onPress={() => navigation.navigate("EmployeeUpload", { employee: data })}
                style={[styles.uploadBtn, { backgroundColor: colors.text }]}
              >
                <Ionicons name="cloud-upload-outline" size={20} color={colors.background} />
                <Text style={[styles.uploadBtnText, { color: colors.background }]}>Upload New File</Text>
              </TouchableOpacity>
            )}

            {isPrivileged && (
              <TouchableOpacity
                onPress={() => navigation.navigate("Documents", { employeeId: data?.id })}
                style={[styles.dossierBtn, { borderColor: colors.accent, backgroundColor: `${colors.accent}05` }]}
              >
                <Ionicons name="folder-open-outline" size={20} color={colors.accent} />
                <Text style={[styles.dossierBtnText, { color: colors.accent }]}>View Full Digital Dossier</Text>
              </TouchableOpacity>
            )}
          </View>

          {canEditEmployee && (
            <View style={styles.dangerZone}>
              <TouchableOpacity
                style={styles.deleteRecordBtn}
                onPress={() => Alert.alert("Admin Alert", "Direct record deletion is restricted to the master dashboard.")}
              >
                <Ionicons name="alert-circle" size={20} color="white" />
                <Text style={styles.deleteRecordText}>Management Overrides</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Shadow.medium,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  heroRole: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  heroBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroDept: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: `${colors.accent}10`,
    gap: 8,
  },
  editHeroText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  modulesContainer: {
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardBody: {
    gap: 16,
  },
  systemLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.accent}10`,
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  systemLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBox: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  linkValue: {
    textDecorationLine: 'underline',
  },
  documentSet: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  docMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  docDelete: {
    padding: 8,
  },
  emptyDocs: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyDocsText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
    ...Shadow.medium,
  },
  uploadBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
  dangerZone: {
    marginTop: 8,
    marginBottom: 60,
  },
  deleteRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    gap: 10,
    ...Shadow.medium,
  },
  deleteRecordText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
