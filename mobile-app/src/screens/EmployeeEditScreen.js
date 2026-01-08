import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../api/apiService";
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';

/**
 * Employee Edit/Create Screen - HR 2026 Redesign
 * Logical grouping of fields into visual modules for better UX
 */
export default function EmployeeEditScreen({ route, navigation }) {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { employee } = route.params || {};
  const isEdit = !!employee;

  // FORM FIELDS
  const [fullName, setFullName] = useState(employee?.full_name || "");
  const [jobTitle, setJobTitle] = useState(employee?.job_title || "");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [country, setCountry] = useState(employee?.country || "");
  const [state, setState] = useState(employee?.state || "");
  const [nationality, setNationality] = useState(employee?.nationality || "");
  const [actualAddress, setActualAddress] = useState(employee?.actual_address || "");
  const [motherAddress, setMotherAddress] = useState(employee?.mother_country_address || "");
  const [idNumber, setIdNumber] = useState(employee?.id_number || "");
  const [birthDate, setBirthDate] = useState(employee?.birth_date || "");
  const [departmentId, setDepartmentId] = useState(employee?.department_id || "");
  const [userId, setUserId] = useState(employee?.user_id || "");

  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [usersRes, deptsRes] = await Promise.all([
        apiService.getUsers(),
        apiService.getDepartments()
      ]);
      if (usersRes?.success) setUsers(usersRes.users || []);
      if (deptsRes?.success) setDepartments(deptsRes.departments || []);
    } catch (err) {
      console.log("Metadata fetch failed", err);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Required Field", "Full name is a mandatory field.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        job_title: jobTitle || null,
        phone: phone || null,
        country: country || null,
        state: state || null,
        nationality: nationality || null,
        actual_address: actualAddress || null,
        mother_country_address: motherAddress || null,
        id_number: idNumber || null,
        birth_date: birthDate || null,
        department_id: departmentId || null,
        user_id: userId || null
      };

      let res;
      if (isEdit) {
        res = await apiService.updateEmployee(employee.id, payload);
      } else {
        res = await apiService.createEmployee(payload);
      }

      if (!res.success) {
        throw new Error(res.message || "Save failed");
      }

      Alert.alert("Success", `Employee record ${isEdit ? 'updated' : 'created'}!`, [
        {
          text: "Confirm",
          onPress: () => {
            navigation.goBack();
          }
        }
      ]);
    } catch (e) {
      Alert.alert("Process Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const styles = getStyles(colors);

  const InputField = ({ label, value, onChange, placeholder, keyboardType = 'default' }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{isEdit ? "Update Directory" : "New Employee"}</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={styles.headerBtn}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Identity & Role</Text>
            </View>
            <InputField label="Full Name *" value={fullName} onChange={setFullName} placeholder="e.g. Johnathan Smith" />
            <InputField label="Official Job Title" value={jobTitle} onChange={setJobTitle} placeholder="e.g. Senior HR Manager" />
            <InputField label="Employee ID / Passport" value={idNumber} onChange={setIdNumber} placeholder="e.g. ABC123456" />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call-outline" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Communication</Text>
            </View>
            <InputField label="Direct Phone" value={phone} onChange={setPhone} placeholder="+1 234 567 890" keyboardType="phone-pad" />
            <InputField label="Nationality" value={nationality} onChange={setNationality} placeholder="e.g. British" />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.statusLabel}>Employment Verification</Text>
            <TouchableOpacity
              style={[styles.statusToggle, { backgroundColor: employee?.status === 'active' ? colors.success : colors.textSecondary }]}
              onPress={() => {
                // Toggle logic if we had status in state, but we don't yet. 
                // Ideally we should add status to state, but for now let's stick to the requested fields.
                // Actually, let's add the simpler text fields first.
              }}
            >
              {/* Placeholder for status toggle if needed later */}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Location Data</Text>
            </View>
            <InputField label="Residing Country" value={country} onChange={setCountry} placeholder="e.g. United Kingdom" />
            <InputField label="State / Province" value={state} onChange={setState} placeholder="e.g. London" />
            <InputField label="Local Address" value={actualAddress} onChange={setActualAddress} placeholder="Current residential address" />
            <InputField label="Mother Country Address" value={motherAddress} onChange={setMotherAddress} placeholder="Permanent home address" />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Vital Statistics</Text>
            </View>
            <InputField label="Date of Birth" value={birthDate} onChange={setBirthDate} placeholder="YYYY-MM-DD" />

            <Text style={styles.inputLabel}>Department Assignment</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptScroll}>
              {departments.map(dept => (
                <TouchableOpacity
                  key={dept.id}
                  style={[styles.deptBtn, departmentId === dept.id && styles.deptBtnActive]}
                  onPress={() => setDepartmentId(dept.id)}
                >
                  <Text style={[styles.deptBtnText, departmentId === dept.id && styles.deptBtnTextActive]}>{dept.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Button
            variant="primary"
            title={saving ? "" : (isEdit ? "Update Database" : "Commit Record")}
            loading={saving}
            onPress={handleSave}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View >
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 60,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 48,
    color: colors.text,
    fontSize: 15,
  },
});
