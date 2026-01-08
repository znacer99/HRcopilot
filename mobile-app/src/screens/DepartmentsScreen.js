// mobile-app/src/screens/DepartmentsScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from "../api/apiService";
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';

export default function DepartmentsScreen({ navigation, user }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [q, setQ] = useState("");
  const [sortMode, setSortMode] = useState("name"); // "name" | "count"

  // Modal state (create/edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const canManage =
    (user?.role || "").includes("it_manager") ||
    (user?.role || "").includes("general_director");

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiService.getDepartments();
      setItems(res?.departments || []);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let data = items;

    if (needle) {
      data = data.filter((d) => {
        const n = (d?.name || "").toLowerCase();
        const ds = (d?.description || "").toLowerCase();
        return n.includes(needle) || ds.includes(needle);
      });
    }

    data = [...data].sort((a, b) => {
      if (sortMode === "count") {
        const ca = Number(a?.employee_count ?? 0);
        const cb = Number(b?.employee_count ?? 0);
        return cb - ca;
      }
      const na = (a?.name || "").toLowerCase();
      const nb = (b?.name || "").toLowerCase();
      return na.localeCompare(nb);
    });

    return data;
  }, [items, q, sortMode]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setDesc("");
    setModalOpen(true);
  };

  const openEdit = (dept) => {
    setEditingId(dept.id);
    setName(dept.name || "");
    setDesc(dept.description || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    Keyboard.dismiss();
    setModalOpen(false);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Department name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiService.updateDepartment(editingId, { name, description: desc });
      } else {
        await apiService.createDepartment({ name, description: desc });
      }
      closeModal();
      load();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const del = (dept) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${dept.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteDepartment(dept.id);
              load();
            } catch (e) {
              Alert.alert("Error", e?.message || "Delete failed");
            }
          },
        },
      ]
    );
  };

  const styles = getStyles(colors);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <View style={styles.iconCircle}>
          <Ionicons name="business" size={24} color={colors.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description || "No description provided."}
          </Text>
          <View style={styles.countBadge}>
            <Ionicons name="people" size={12} color={colors.textSecondary} />
            <Text style={styles.countText}>{item.employee_count || 0} Employees</Text>
          </View>
        </View>
      </View>

      {canManage && (
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => del(item)} style={styles.actionBtn}>
            <Ionicons name="trash" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>Units</Text>
            <Text style={styles.screenSubtitle}>ALGHAITH Group Structure</Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search ALGHAITH units..."
            placeholderTextColor={colors.textSecondary}
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sortBar}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            onPress={() => setSortMode("name")}
            style={[styles.sortBtn, sortMode === "name" && styles.sortBtnActive]}
          >
            <Text style={[styles.sortBtnText, sortMode === "name" && styles.sortBtnActiveText]}>Name</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortMode("count")}
            style={[styles.sortBtn, sortMode === "count" && styles.sortBtnActive]}
          >
            <Text style={[styles.sortBtnText, sortMode === "count" && styles.sortBtnActiveText]}>Headcount</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !items.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Ionicons name="business-outline" size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>No departments found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search criteria.</Text>
            </View>
          }
        />
      )}

      {canManage && (
        <View style={styles.footer}>
          <Button
            title="Create Department"
            icon="plus-circle"
            variant="primary"
            onPress={openCreate}
          />
        </View>
      )}

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalBlur}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {editingId ? "Edit Department" : "New Department"}
                    </Text>
                    <TouchableOpacity onPress={closeModal}>
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Department Name</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g., Human Resources"
                      placeholderTextColor={colors.textSecondary}
                      style={styles.modalInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      value={desc}
                      onChangeText={setDesc}
                      multiline
                      placeholder="Organization unit details..."
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.modalInput, styles.textArea]}
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <Button
                      title="Cancel"
                      variant="secondary"
                      onPress={closeModal}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title={saving ? "" : "Save"}
                      loading={saving}
                      variant="primary"
                      onPress={save}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
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
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
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
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: 12,
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 4,
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
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: Radius.xl,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
  },
  modalBlur: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    ...Shadow.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    ...Typography.h2,
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
    color: colors.text,
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
});
