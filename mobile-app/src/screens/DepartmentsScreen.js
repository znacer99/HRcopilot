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
} from "react-native";
import apiService from "../api/apiService";

export default function DepartmentsScreen({ navigation, user }) {
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
    const n = name.trim();
    if (!n) {
      Alert.alert("Missing name", "Department name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await apiService.updateDepartment(editingId, {
          name: n,
          description: desc?.trim() || "",
        });
      } else {
        await apiService.createDepartment({
          name: n,
          description: desc?.trim() || "",
        });
      }
      Keyboard.dismiss();
      setModalOpen(false);
      await load();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (dept) => {
    Alert.alert(
      "Delete department?",
      `This will delete "${dept.name}".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => doDelete(dept.id),
        },
      ],
      { cancelable: true }
    );
  };

  const doDelete = async (id) => {
    try {
      await apiService.deleteDepartment(id);
      await load();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to delete department");
    }
  };

  const onLongPressItem = (dept) => {
    if (!canManage) return;

    Alert.alert(
      dept.name,
      "Actions",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Edit", onPress: () => openEdit(dept) },
        { text: "Delete", style: "destructive", onPress: () => confirmDelete(dept) },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        Keyboard.dismiss();
        navigation.navigate("DepartmentDetail", { id: item.id });
      }}
      onLongPress={() => onLongPressItem(item)}
      style={{
        marginHorizontal: 12,
        marginTop: 10,
        padding: 14,
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 16, fontWeight: "700", flex: 1, paddingRight: 10 }}>
          {item.name}
        </Text>

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            backgroundColor: "#f9fafb",
          }}
        >
          <Text style={{ fontSize: 12, color: "#374151" }}>
            {item.employee_count ?? 0} emp
          </Text>
        </View>
      </View>

      {!!item.description && (
        <Text style={{ marginTop: 8, color: "#4b5563" }} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {canManage ? (
        <Text style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
          Long-press for Edit/Delete
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f6f6f6" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
          {/* Top controls */}
          <View style={{ padding: 12, gap: 10 }}>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#eee",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search departments..."
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
                style={{ fontSize: 14 }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setSortMode("name");
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: sortMode === "name" ? "white" : "#f3f4f6",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "700" }}>Sort A–Z</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setSortMode("count");
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: sortMode === "count" ? "white" : "#f3f4f6",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "700" }}>Sort by size</Text>
              </TouchableOpacity>
            </View>

            {canManage ? (
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  openCreate();
                }}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "800" }}>+ Add Department</Text>
              </TouchableOpacity>
            ) : null}

            {!!errorMsg && (
              <View
                style={{
                  padding: 10,
                  backgroundColor: "white",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#fee2e2",
                }}
              >
                <Text style={{ color: "red" }}>{errorMsg}</Text>
              </View>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ListEmptyComponent={
              !loading ? (
                <View style={{ padding: 20 }}>
                  <Text style={{ color: "#555" }}>
                    {q.trim() ? "No matches." : "No departments found."}
                  </Text>
                </View>
              ) : null
            }
          />

          {/* Create/Edit modal */}
          <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={closeModal}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 16 }}>
                <View style={{ backgroundColor: "white", borderRadius: 14, padding: 14 }}>
                  <Text style={{ fontSize: 16, fontWeight: "800" }}>
                    {editingId ? "Edit Department" : "New Department"}
                  </Text>

                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Name</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g., Human Resources"
                      returnKeyType="next"
                      style={{
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                      }}
                    />
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Description</Text>
                    <TextInput
                      value={desc}
                      onChangeText={setDesc}
                      placeholder="Optional"
                      multiline
                      style={{
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        minHeight: 80,
                        textAlignVertical: "top",
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      onPress={closeModal}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: "#f3f4f6",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "800" }}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={save}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: "white",
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        alignItems: "center",
                      }}
                    >
                      {saving ? <ActivityIndicator /> : <Text style={{ fontWeight: "800" }}>Save</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
