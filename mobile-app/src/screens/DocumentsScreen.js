import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import documentEngine from "../utils/documentEngine";

import Card from "../components/Card";
import apiService, { BASE_URL } from "../api/apiService";
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';

export default function DocumentsScreen({ user, route, navigation }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [myEmployee, setMyEmployee] = useState(null);
  const [myDocs, setMyDocs] = useState([]);

  const [search, setSearch] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const isPrivileged = ["general_director", "it_manager"].includes(
    (user?.role || "").toLowerCase()
  );

  const findMyEmployee = useCallback(
    (list) => {
      if (!user) return null;

      return (
        list.find((e) => e?.user_id === user?.id) ||
        list.find((e) => e?.user?.id === user?.id) ||
        list.find(
          (e) =>
            (e?.full_name || "").trim().toLowerCase() ===
            (user?.name || "").trim().toLowerCase()
        ) ||
        null
      );
    },
    [user]
  );

  const loadMyDocuments = useCallback(async () => {
    const targetEmployeeId = route?.params?.employeeId;

    setLoading(true);
    try {
      if (isPrivileged) {
        // Admins can see "everything" conceptually, but we need to fetch all employees first
        const empRes = await apiService.getEmployees();
        const list = empRes?.success ? empRes.employees || [] : [];
        setEmployees(list);

        // If we came from a specific employee profile, show those docs
        if (targetEmployeeId) {
          const specificEmp = list.find(e => e.id === targetEmployeeId);
          setMyEmployee(specificEmp);
          const docsRes = await apiService.getEmployeeDocuments(targetEmployeeId);
          setMyDocs(docsRes?.success ? docsRes.documents || [] : []);
        } else {
          // Default to self for admin too
          const me = findMyEmployee(list);
          setMyEmployee(me);
          if (me?.id) {
            const docsRes = await apiService.getEmployeeDocuments(me.id);
            setMyDocs(docsRes?.success ? docsRes.documents || [] : []);
          }
        }
      } else {
        // Standard user flow
        const empRes = await apiService.getEmployees();
        const list = empRes?.success ? empRes.employees || [] : [];
        setEmployees(list);

        const me = findMyEmployee(list);
        setMyEmployee(me);

        if (me?.id) {
          const docsRes = await apiService.getEmployeeDocuments(me.id);
          setMyDocs(docsRes?.success ? docsRes.documents || [] : []);
        }
      }
    } catch (e) {
      console.log("Docs load failed:", e);
      Alert.alert("Error", "Failed to load dossiers.");
      setMyDocs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, findMyEmployee, isPrivileged, route?.params?.employeeId]);

  useEffect(() => {
    loadMyDocuments();
  }, [loadMyDocuments]);

  useEffect(() => {
    const unsub = navigation?.addListener?.("focus", loadMyDocuments);
    return unsub;
  }, [navigation, loadMyDocuments]);

  const toTime = (uploaded_at) => {
    if (!uploaded_at) return 0;
    const t = Date.parse(uploaded_at);
    return Number.isNaN(t) ? 0 : t;
  };

  const visibleDocs = useMemo(() => {
    const q = (search || "").trim().toLowerCase();

    let docs = Array.isArray(myDocs) ? [...myDocs] : [];

    if (q) {
      docs = docs.filter((d) =>
        (d?.filename || "").toLowerCase().includes(q)
      );
    }

    docs.sort((a, b) => {
      const ta = toTime(a.uploaded_at);
      const tb = toTime(b.uploaded_at);
      return sortNewestFirst ? tb - ta : ta - tb;
    });

    return docs;
  }, [myDocs, search, sortNewestFirst]);

  const download = async (doc) => {
    await documentEngine.downloadAndPreview('employee', doc.id, doc.filename);
  };

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.screenTitle}>Dossiers</Text>
            <Text style={styles.screenSubtitle}>ALGHAITH Digital Assets</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search ALGHAITH dossiers..."
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

        <View style={styles.sortContainer}>
          <TouchableOpacity
            style={[styles.sortBtn, sortNewestFirst && styles.sortBtnActive]}
            onPress={() => setSortNewestFirst(true)}
          >
            <Text style={[styles.sortBtnText, sortNewestFirst && styles.sortBtnActiveText]}>Newest First</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, !sortNewestFirst && styles.sortBtnActive]}
            onPress={() => setSortNewestFirst(false)}
          >
            <Text style={[styles.sortBtnText, !sortNewestFirst && styles.sortBtnActiveText]}>Oldest First</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {myEmployee ? `${myEmployee.full_name}'s Dossier` : "Personal Repository"}
          </Text>
          <Text style={styles.sectionCounter}>{visibleDocs.length} items</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingText}>Syncing repository...</Text>
          </View>
        ) : visibleDocs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="file-tray-outline" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Empty Repository</Text>
            <Text style={styles.emptySubtitle}>No matching documents found.</Text>
          </View>
        ) : (
          visibleDocs.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.docCard}
              onPress={() => download(doc)}
              activeOpacity={0.7}
            >
              <View style={styles.docIcon}>
                <Ionicons
                  name={doc.document_type?.toLowerCase().includes('pdf') ? "document-text" : "document"}
                  size={24}
                  color={colors.accent}
                />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{doc.filename}</Text>
                <Text style={styles.docMeta}>
                  {doc.document_type?.toUpperCase()} • {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'Unknown Date'}
                </Text>
              </View>
              <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}

        {isPrivileged && (
          <View style={styles.adminSection}>
            <View style={[styles.adminCard, { backgroundColor: colors.primary }]}>
              <View style={styles.adminCardHeader}>
                <Ionicons name="shield-checkmark" size={24} color="white" />
                <Text style={styles.adminCardTitle}>Admin Control</Text>
              </View>
              <Text style={styles.adminCardDesc}>
                You have access to oversee all system documents and employee records.
              </Text>
              <Button
                title="Manage All Employees"
                variant="secondary"
                onPress={() => navigation.navigate('Staff')}
                style={{ marginTop: 12 }}
              />
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
  },
  screenSubtitle: {
    ...Typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -2,
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
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: 12,
    gap: 12,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortBtnActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}10`,
  },
  sortBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sortBtnActiveText: {
    color: colors.accent,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  sectionCounter: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: Radius.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${colors.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  docName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  docMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
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
  adminSection: {
    marginTop: 24,
  },
  adminCard: {
    padding: 20,
    borderRadius: Radius.xl,
    ...Shadow.medium,
  },
  adminCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  adminCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  adminCardDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});
