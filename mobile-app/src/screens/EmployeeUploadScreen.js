// src/screens/EmployeeUploadScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../api/apiService";

export default function EmployeeUploadScreen({ route, navigation }) {
  const { employee } = route.params;

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!result.canceled) {
      setFile(result.assets[0]);
    }
  };

  const uploadNow = async () => {
    if (!file) {
      Alert.alert("Missing file", "Please choose a file to upload.");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Missing title", "Document title is required.");
      return;
    }

    setUploading(true);

    try {
      const form = new FormData();

      form.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
      });

      form.append("title", title);
      form.append("description", description);

      console.log("📤 STARTING UPLOAD to /api/employees/" + employee.id + "/upload");
      const res = await apiService.uploadEmployeeDocuments(employee.id, form);
      console.log("📥 UPLOAD RESPONSE:", res);

      if (!res?.success) {
        throw new Error(res?.message || "Upload failed");
      }

      Alert.alert("Success", "Document uploaded successfully.");

      navigation.goBack();
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Upload error", "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Upload Document</Text>
      <Text style={styles.subtitle}>{employee.full_name}</Text>

      <View style={styles.card}>
        {/* TITLE */}
        <Text style={styles.label}>Document Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Work Contract – 2024"
          value={title}
          onChangeText={setTitle}
        />

        {/* DESCRIPTION */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Optional description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* FILE PICKER */}
        <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
          <Ionicons name="document-outline" size={20} color="#fff" />
          <Text style={styles.pickButtonText}>
            {file ? "Change File" : "Choose File"}
          </Text>
        </TouchableOpacity>

        {file && (
          <View style={styles.fileInfo}>
            <Ionicons name="document-text-outline" size={18} color="#2563eb" />
            <Text style={styles.fileName}>{file.name}</Text>
          </View>
        )}

        {/* UPLOAD */}
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.disabled]}
          disabled={uploading}
          onPress={uploadNow}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#f5f7fa",
  },

  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },

  label: {
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },

  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },

  pickButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  pickButtonText: { color: "#fff", marginLeft: 10, fontSize: 16 },

  fileInfo: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  fileName: { marginLeft: 8, color: "#111" },

  uploadButton: {
    marginTop: 24,
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButtonText: { color: "#fff", marginLeft: 10, fontSize: 16 },

  disabled: { opacity: 0.5 },
});
