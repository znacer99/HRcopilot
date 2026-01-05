// src/screens/EmployeeEditScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../api/apiService";

export default function EmployeeEditScreen({ route, navigation }) {
  const { employee, onUpdated } = route.params || {};

  if (!employee) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>No employee data to edit.</Text>
      </View>
    );
  }

  // FORM FIELDS
  const [fullName, setFullName] = useState(employee.full_name || "");
  const [jobTitle, setJobTitle] = useState(employee.job_title || "");
  const [phone, setPhone] = useState(employee.phone || "");
  const [country, setCountry] = useState(employee.country || "");
  const [state, setState] = useState(employee.state || "");
  const [nationality, setNationality] = useState(employee.nationality || "");
  const [actualAddress, setActualAddress] = useState(employee.actual_address || "");
  const [motherAddress, setMotherAddress] = useState(employee.mother_country_address || "");
  const [idNumber, setIdNumber] = useState(employee.id_number || "");
  const [birthDate, setBirthDate] = useState(employee.birth_date || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Full name is required.");
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
      };

      const res = await apiService.updateEmployee(employee.id, payload);

      if (!res.success) {
        throw new Error(res.message || "Update failed");
      }

      Alert.alert("Success", "Employee updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            if (onUpdated) onUpdated();
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", err.message || "Could not update employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Edit Employee</Text>
          <Text style={styles.subtitle}>{employee.full_name}</Text>
        </View>

        <View style={styles.headerIconWrap}>
          <Ionicons name="person-circle-outline" size={36} color="#2563eb" />
        </View>
      </View>

      {/* SECTION – BASIC INFO */}
      <View style={styles.card}>
        <Section title="Basic Information" />

        <Input label="Full Name" value={fullName} setter={setFullName} />
        <Input label="Job Title" value={jobTitle} setter={setJobTitle} />
      </View>

      {/* CONTACT */}
      <View style={styles.card}>
        <Section title="Contact Information" />

        <Input label="Phone" value={phone} setter={setPhone} keyboardType="phone-pad" />
        <Input label="Country" value={country} setter={setCountry} />
        <Input label="State" value={state} setter={setState} />
        <Input label="Nationality" value={nationality} setter={setNationality} />
      </View>

      {/* ADDRESSES */}
      <View style={styles.card}>
        <Section title="Addresses" />

        <Input
          label="Actual Address"
          value={actualAddress}
          setter={setActualAddress}
          multiline
        />

        <Input
          label="Mother Country Address"
          value={motherAddress}
          setter={setMotherAddress}
          multiline
        />
      </View>

      {/* IDENTITY */}
      <View style={styles.card}>
        <Section title="Identity" />

        <Input label="ID Number" value={idNumber} setter={setIdNumber} />

        <Input
          label="Birth Date (YYYY-MM-DD)"
          value={birthDate}
          setter={setBirthDate}
          keyboardType="numeric"
        />
      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        disabled={saving}
        onPress={handleSave}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

/* --- SMALL COMPONENTS --- */

const Section = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const Input = ({ label, value, setter, keyboardType, multiline }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 80 }]}
      value={value}
      onChangeText={setter}
      keyboardType={keyboardType}
      multiline={multiline}
    />
  </View>
);

/* --- STYLES --- */

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f5f7fa", padding: 16 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red", fontSize: 16 },

  headerRow: { flexDirection: "row", marginBottom: 20 },
  headerInfo: { flex: 1 },

  headerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5edff",
    justifyContent: "center",
    alignItems: "center",
  },

  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#6b7280" },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  field: { marginBottom: 14 },
  label: { color: "#6b7280", fontWeight: "600", marginBottom: 4 },

  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 10,
    borderRadius: 8,
    fontSize: 15,
  },

  saveButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 999,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },

  saveButtonDisabled: { opacity: 0.7 },

  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
});
