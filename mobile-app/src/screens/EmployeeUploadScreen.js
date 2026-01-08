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
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../api/apiService";
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';

/**
 * Employee Upload Screen - HR 2026 Redesign
 */
export default function EmployeeUploadScreen({ route, navigation }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
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

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Archive Document</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.headerBtn}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="cloud-upload-outline" size={32} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Repository Add</Text>
          <Text style={styles.heroSubtitle}>Archiving for {employee.full_name}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>FILE SELECTION</Text>
          <TouchableOpacity style={[styles.filePicker, file && styles.filePickerActive]} onPress={pickFile}>
            <Ionicons
              name={file ? "checkmark-circle" : "document-attach-outline"}
              size={32}
              color={file ? colors.success : colors.textSecondary}
            />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.pickTitle, file && { color: colors.text }]}>
                {file ? file.name : "Choose Document"}
              </Text>
              <Text style={styles.pickSubtitle}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF, DOCX, or Images"}
              </Text>
            </View>
            {!file && <Ionicons name="add-circle" size={24} color={colors.accent} />}
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DOCUMENT TITLE *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Q3 Performance Report"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>OPTIONAL NOTES</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter additional context here..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>
        </View>

        <View style={styles.actionSection}>
          <Button
            variant="primary"
            title={uploading ? "" : "Commit to Archive"}
            loading={uploading}
            onPress={uploadNow}
            icon="cloud-upload"
          />
          <Text style={styles.disclaimer}>
            Files are processed through secure corporate cloud infrastructure.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: `${colors.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Shadow.subtle,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  formSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  filePickerActive: {
    borderColor: colors.success,
    borderStyle: 'solid',
    backgroundColor: `${colors.success}05`,
  },
  pickTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pickSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 52,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: 14,
  },
  actionSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: 12,
  },
  disclaimer: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
