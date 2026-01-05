import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import Card from "../components/Card";
import apiService from "../api/apiService";

const BASE_URL = "http://102.213.182.101:5000";

export default function DocumentsScreen({ user, navigation }) {
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
    if (!user?.id) {
      setMyEmployee(null);
      setMyDocs([]);
      return;
    }

    setLoading(true);
    try {
      const empRes = await apiService.getEmployees();
      const list = empRes?.success ? empRes.employees || [] : [];
      setEmployees(list);

      const me = findMyEmployee(list);
      setMyEmployee(me);

      if (!me?.id) {
        setMyDocs([]);
        return;
      }

      const docsRes = await apiService.getEmployeeDocuments(me.id);
      const docs = docsRes?.success ? docsRes.documents || [] : [];
      setMyDocs(docs);
    } catch (e) {
      console.log("Docs load failed:", e);
      Alert.alert("Error", "Failed to load your documents.");
      setMyDocs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, findMyEmployee]);

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
      docs = docs.filter((d) => {
        const filename = (d?.filename || "").toLowerCase();
        const dtype = (d?.document_type || "").toLowerCase();
        return filename.includes(q) || dtype.includes(q);
      });
    }

    docs.sort((a, b) => {
      const ta = toTime(a?.uploaded_at);
      const tb = toTime(b?.uploaded_at);
      return sortNewestFirst ? tb - ta : ta - tb;
    });

    return docs;
  }, [myDocs, search, sortNewestFirst]);

  const openDoc = async (doc) => {
    try {
      const token = await apiService.getToken();
      if (!token) return Alert.alert("Auth", "Missing token. Please login again.");

      const url = `${BASE_URL}/api/documents/employee/${doc.id}/download`;
      const localPath =
        FileSystem.documentDirectory + (doc.filename || `doc_${doc.id}`);

      const res = await FileSystem.downloadAsync(url, localPath, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) return await Sharing.shareAsync(res.uri);

      Alert.alert("Downloaded", "File downloaded. Sharing not available on this device.");
    } catch (e) {
      console.log("Open doc failed:", e);
      Alert.alert("Open failed", "Cannot open this document.");
    }
  };

  const onDeleteDoc = (doc) => {
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
              loadMyDocuments();
            } catch (e) {
              console.log("❌ Delete error:", e);
              Alert.alert("Error", "Delete failed");
            }
          },
        },
      ]
    );
  };

  const toggleSort = () => setSortNewestFirst((v) => !v);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.subtitle}>Your documents only</Text>
      </View>

      <Card style={styles.card}>
        <Ionicons name="information-circle-outline" size={22} color="#2563eb" />
        <Text style={styles.infoText}>
          These are documents uploaded to your employee profile.
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={loadMyDocuments} style={styles.refreshBtn}>
            <Ionicons name="refresh-outline" size={16} color="#2563eb" />
            <Text style={styles.refreshText}>{loading ? "Loading..." : "Refresh"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleSort} style={styles.sortBtn}>
            <Ionicons name="swap-vertical-outline" size={16} color="#2563eb" />
            <Text style={styles.sortText}>
              {sortNewestFirst ? "Newest first" : "Oldest first"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#6b7280" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by filename or type..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.meRow}>
          <Ionicons name="person-outline" size={20} color="#2563eb" />
          <View style={{ flex: 1 }}>
            <Text style={styles.meName}>
              {myEmployee?.full_name || user?.name || "Unknown user"}
            </Text>
            <Text style={styles.meMeta}>
              {myEmployee?.job_title || "—"} • {myEmployee?.department?.name || "—"}
            </Text>
          </View>
          <Text style={styles.count}>{visibleDocs.length}</Text>
        </View>

        {visibleDocs.length ? (
          visibleDocs.map((d) => (
            <TouchableOpacity key={d.id} style={styles.docRow} onPress={() => openDoc(d)}>
              <Ionicons name="document-text-outline" size={18} color="#2563eb" />
              <View style={{ flex: 1 }}>
                <Text style={styles.docName}>{d.filename}</Text>
                <Text style={styles.docMeta}>
                  {(d.document_type || "document")} •{" "}
                  {(d.uploaded_at || "").replace("T", " ").slice(0, 19)}
                </Text>
              </View>

              <View style={styles.rightIcons}>
                <Ionicons name="download-outline" size={18} color="#6b7280" />

                {isPrivileged && (
                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      onDeleteDoc(d);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.empty}>
            {myEmployee?.id
              ? search
                ? "No documents match your search."
                : "No documents for you yet."
              : "Your employee profile was not found (cannot map user → employee)."}
          </Text>
        )}
      </Card>
    </ScrollView>
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

  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  infoText: { marginTop: 8, fontSize: 14, color: "#374151" },

  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  refreshBtn: { flexDirection: "row", alignItems: "center" },
  refreshText: { marginLeft: 6, color: "#2563eb", fontWeight: "700" },

  sortBtn: { flexDirection: "row", alignItems: "center" },
  sortText: { marginLeft: 6, color: "#2563eb", fontWeight: "700" },

  searchWrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },

  meRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  meName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  meMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  count: { fontSize: 12, color: "#6b7280", fontWeight: "700" },

  docRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#f3f4f6",
  },
  docName: { fontSize: 14, fontWeight: "600", color: "#2563eb" },
  docMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },

  rightIcons: { flexDirection: "row", alignItems: "center", gap: 12 },
  trashBtn: { padding: 2 },

  empty: { marginTop: 10, color: "#6b7280" },
});
