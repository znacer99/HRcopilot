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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../api/apiService";

/**
 * Employee Upload Screen - Premium Redesign
 * Modern document upload interface with clear feedback and file selection
 */
export default function EmployeeUploadScreen({ route, navigation }) {
  const { employee } = route.params;

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Picker Error", "Could not open document picker.");
    }
  };

  const uploadNow = async () => {
    if (!file) {
      Alert.alert("Attachment Required", "Please select a document to upload.");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Missing Metadata", "Please provide a title for this document.");
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

      const res = await apiService.uploadEmployeeDocuments(employee.id, form);

      if (!res?.success) {
        throw new Error(res?.message || "Upload failed");
      }

      Alert.alert("Success", "Document archived successfully.", [
        { text: "Done", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Upload Failure", "We encountered an issue while saving the document.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIconBtn}>
            <Ionicons name="close-outline" size={28} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Document</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <View style={styles.employeeCircle}>
            <Ionicons name="person" size={24} color="#2563eb" />
          </View>
          <Text style={styles.heroTitle}>{employee.full_name}</Text>
          <Text style={styles.heroSubtitle}>Record # {employee.id}</Text>
        </View>

        <View style={styles.uploadCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Ionicons name="cloud-upload" size={20} color="#2563eb" />
            </View>
            <Text style={styles.cardTitle}>Digital Archive</Text>
          </View>

          {/* TITLE */}
          <View style={styles.field}>
            <Text style={styles.label}>Document Label *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Identity Card, Contract"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* DESCRIPTION */}
          <View style={styles.field}>
            <Text style={styles.label}>Detailed Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional context about this file..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* FILE PICKER UI */}
          <View style={styles.pickerSection}>
            <Text style={styles.label}>Attachment</Text>
            {file ? (
              <View style={styles.fileSelectedBox}>
                <View style={styles.fileInfoMain}>
                  <Ionicons name="document-text" size={24} color="#3b82f6" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</Text>
                  </View>
                  <TouchableOpacity onPress={() => setFile(null)}>
                    <Ionicons name="trash-outline" size={20} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.pickZone} onPress={pickFile}>
                <Ionicons name="attach" size={32} color="#94a3b8" />
                <Text style={styles.pickZoneText}>Tap to select a file</Text>
                <Text style={styles.pickZoneSub}>PDF, Images, or Documents</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* UPLOAD BUTTON */}
          <TouchableOpacity
            style={[styles.uploadButton, (!file || uploading) && styles.disabled]}
            disabled={!file || uploading}
            onPress={uploadNow}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.uploadButtonText}>Securely Upload</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerSafeArea: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  heroBlock: {
    alignItems: 'center',
    marginBottom: 30,
  },
  employeeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uploadCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  pickerSection: {
    marginBottom: 24,
  },
  pickZone: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickZoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  pickZoneSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  fileSelectedBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  fileInfoMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  fileSize: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  uploadButton: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  uploadButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  disabled: { opacity: 0.6 },
});
