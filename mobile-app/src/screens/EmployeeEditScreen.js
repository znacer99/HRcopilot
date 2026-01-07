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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import apiService from "../api/apiService";

/**
 * Employee Edit/Create Screen - Premium Redesign
 * Logical grouping of fields into visual modules for better UX
 */
export default function EmployeeEditScreen({ route, navigation }) {
  const { employee, onUpdated } = route.params || {};
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
      if (usersRes.success) setUsers(usersRes.users);
      if (deptsRes.success) setDepartments(deptsRes.departments);
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

      Alert.alert("Success", `Employee ${isEdit ? 'updated' : 'created'} successfully!`, [
        {
          text: "View Profile",
          onPress: () => {
            if (onUpdated) onUpdated();
            navigation.goBack();
          },
        },
      ]);
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("System Error", err.message || "Could not save employee data.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIconBtn}>
            <Ionicons name="close-outline" size={28} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Record' : 'New Employee'}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveBtnTop}
          >
            {saving ? <ActivityIndicator size="small" color="#2563eb" /> : <Text style={styles.saveBtnTopText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION – WORK INFO */}
          <FormCard title="Work Assignment" icon="briefcase" color="#3b82f6">
            <Input label="Full Name *" value={fullName} setter={setFullName} placeholder="e.g. John Doe" />
            <Input label="Job Title" value={jobTitle} setter={setJobTitle} placeholder="e.g. Senior Manager" />

            <View style={styles.pickerBlock}>
              <Text style={styles.pickerLabel}>Department Mapping</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                <TouchableOpacity
                  style={[styles.pill, !departmentId && styles.pillActive]}
                  onPress={() => setDepartmentId(null)}
                >
                  <Text style={[styles.pillText, !departmentId && styles.pillTextActive]}>Not Assigned</Text>
                </TouchableOpacity>
                {departments.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.pill, departmentId === d.id && styles.pillActive]}
                    onPress={() => setDepartmentId(d.id)}
                  >
                    <Text style={[styles.pillText, departmentId === d.id && styles.pillTextActive]}>{d.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </FormCard>

          {/* SECTION - DIGITAL ACCESS */}
          <FormCard title="Digital Access" icon="key" color="#7c3aed">
            <Text style={styles.helperText}>Connect this HR record to a system user account to grant portal access.</Text>
            <View style={styles.pickerBlock}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                <TouchableOpacity
                  style={[styles.pill, !userId && styles.pillActive]}
                  onPress={() => setUserId(null)}
                >
                  <Text style={[styles.pillText, !userId && styles.pillTextActive]}>Do Not Link</Text>
                </TouchableOpacity>
                {users.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.pill, userId === u.id && styles.pillActive]}
                    onPress={() => setUserId(u.id)}
                  >
                    <Text style={[styles.pillText, userId === u.id && styles.pillTextActive]}>{u.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </FormCard>

          {/* CONTACT */}
          <FormCard title="Communication" icon="call" color="#10b981">
            <Input label="Mobile Number" value={phone} setter={setPhone} keyboardType="phone-pad" placeholder="+123456789" />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input label="Region" value={country} setter={setCountry} placeholder="Country" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Input label="State" value={state} setter={setState} placeholder="State" />
              </View>
            </View>
            <Input label="Nationality" value={nationality} setter={setNationality} placeholder="Country of origin" />
          </FormCard>

          {/* ADDRESSES */}
          <FormCard title="Location Details" icon="location" color="#f59e0b">
            <Input
              label="Standard Residence"
              value={actualAddress}
              setter={setActualAddress}
              multiline
              placeholder="Full mailing address"
            />
            <Input
              label="Origin Country Address"
              value={motherAddress}
              setter={setMotherAddress}
              multiline
              placeholder="Permanent home address"
            />
          </FormCard>

          {/* IDENTITY */}
          <FormCard title="Identity Verification" icon="id-card" color="#6366f1">
            <Input label="ID / Passport Number" value={idNumber} setter={setIdNumber} placeholder="Unique identifier" />
            <Input
              label="Date of Birth"
              value={birthDate}
              setter={setBirthDate}
              keyboardType="numeric"
              placeholder="YYYY-MM-DD"
            />
          </FormCard>

          {/* BOTTOM ACTION */}
          <TouchableOpacity
            style={[styles.saveButtonFull, saving && styles.saveButtonDisabled]}
            disabled={saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Finalize Record</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* --- SMALL COMPONENTS --- */

function FormCard({ title, icon, color, children }) {
  return (
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBox, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>
        {children}
      </View>
    </View>
  );
}

const Input = ({ label, value, setter, keyboardType, multiline, placeholder }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && { height: 70, textAlignVertical: 'top' }]}
      value={value || ""}
      onChangeText={setter}
      keyboardType={keyboardType}
      multiline={multiline}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
    />
  </View>
);

/* --- STYLES --- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  saveBtnTop: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
  },
  saveBtnTopText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 15,
  },
  screen: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardBody: {
    gap: 16,
  },
  field: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  helperText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 18,
  },
  pickerBlock: {
    marginTop: 4,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  pillScroll: {
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  pillText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  pillTextActive: {
    color: 'white',
  },
  saveButtonFull: {
    backgroundColor: "#0f172a",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },
});
