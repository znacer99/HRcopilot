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
 * Candidate Edit Screen - Premium Redesign
 * Logical grouping of fields into visual modules for better UX
 */
export default function CandidateEditScreen({ route, navigation }) {
    const { candidate, onUpdated } = route.params || {};
    const isEdit = !!candidate;

    // FORM FIELDS
    const [fullName, setFullName] = useState(candidate?.full_name || "");
    const [email, setEmail] = useState(candidate?.email || "");
    const [phone, setPhone] = useState(candidate?.phone || "");
    const [nationality, setNationality] = useState(candidate?.nationality || "");
    const [position, setPosition] = useState(candidate?.applied_position || "");
    const [specialty, setSpecialty] = useState(candidate?.specialty || "");
    const [experience, setExperience] = useState(candidate?.experience || "");
    const [education, setEducation] = useState(candidate?.education || "");
    const [skills, setSkills] = useState(candidate?.skills || "");
    const [status, setStatus] = useState(candidate?.status || "new");
    const [departmentId, setDepartmentId] = useState(candidate?.department_id || "");

    const [saving, setSaving] = useState(false);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const res = await apiService.getDepartments();
            if (res.success) setDepartments(res.departments);
        } catch (err) {
            console.log("Metadata fetch failed", err);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim() || !position.trim()) {
            Alert.alert("Required Fields", "Name and Applied Position are mandatory.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                full_name: fullName.trim(),
                email: email.trim() || null,
                phone: phone || null,
                nationality: nationality || null,
                applied_position: position.trim(),
                specialty: specialty || null,
                experience: experience || null,
                education: education || null,
                skills: skills || null,
                status: status,
                department_id: departmentId || null,
            };

            let res;
            if (isEdit) {
                res = await apiService.updateCandidate(candidate.id, payload);
            } else {
                res = await apiService.createCandidate(payload);
            }

            if (!res.success) {
                throw new Error(res.message || "Save failed");
            }

            Alert.alert("Success", `Lead ${isEdit ? 'updated' : 'captured'} successfully!`, [
                {
                    text: "View Pipeline",
                    onPress: () => {
                        if (onUpdated) onUpdated();
                        navigation.goBack();
                    },
                },
            ]);
        } catch (err) {
            console.error("Save error:", err);
            Alert.alert("System Error", err.message || "Could not save recruitment data.");
        } finally {
            setSaving(false);
        }
    };

    const statusOptions = ['new', 'interview', 'offer', 'hired', 'rejected'];

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                <View style={styles.topNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navIconBtn}>
                        <Ionicons name="close-outline" size={28} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{isEdit ? 'Modify Lead' : 'Capture Lead'}</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        style={styles.saveBtnTop}
                    >
                        {saving ? <ActivityIndicator size="small" color="#0f172a" /> : <Text style={styles.saveBtnTopText}>Finalize</Text>}
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
                    {/* SECTION – IDENTITY */}
                    <FormCard title="Candidate Bio" icon="person" color="#3b82f6">
                        <Input label="Full Name *" value={fullName} setter={setFullName} placeholder="e.g. Michael Chen" />
                        <Input label="Email Identity" value={email} setter={setEmail} keyboardType="email-address" placeholder="name@domain.com" />
                        <Input label="Mobile Line" value={phone} setter={setPhone} keyboardType="phone-pad" placeholder="+1..." />
                        <Input label="Nationality" value={nationality} setter={setNationality} placeholder="Country code or name" />
                    </FormCard>

                    {/* SECTION – PIPELINE STATUS */}
                    <FormCard title="Pipeline Management" icon="layers" color="#10b981">
                        <Input label="Applied Position *" value={position} setter={setPosition} placeholder="e.g. Lead Developer" />
                        <Input label="Specialty Focus" value={specialty} setter={setSpecialty} placeholder="e.g. Backend Architecture" />

                        <View style={styles.pickerBlock}>
                            <Text style={styles.pickerLabel}>Unit Assignment</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                                <TouchableOpacity
                                    style={[styles.pill, !departmentId && styles.pillActive]}
                                    onPress={() => setDepartmentId(null)}
                                >
                                    <Text style={[styles.pillText, !departmentId && styles.pillTextActive]}>Unassigned</Text>
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

                        <View style={[styles.pickerBlock, { marginTop: 12 }]}>
                            <Text style={styles.pickerLabel}>Pipeline Status</Text>
                            <View style={styles.pillGrid}>
                                {statusOptions.map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.pill, status === opt && styles.pillActive]}
                                        onPress={() => setStatus(opt)}
                                    >
                                        <Text style={[styles.pillText, status === opt && styles.pillTextActive]}>
                                            {opt.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </FormCard>

                    {/* EXPERIENCE */}
                    <FormCard title="Experience Profile" icon="ribbon" color="#f59e0b">
                        <Input label="Experience Summary" value={experience} setter={setExperience} multiline placeholder="Years, previous roles..." />
                        <Input label="Educational Background" value={education} setter={setEducation} multiline placeholder="Degrees, institutions..." />
                        <Input label="Skill Repository" value={skills} setter={setSkills} multiline placeholder="Technologies, methodologies..." />
                    </FormCard>

                    {/* BOTTOM ACTION */}
                    <TouchableOpacity
                        style={[styles.finalizeButton, saving && styles.disabled]}
                        disabled={saving}
                        onPress={handleSave}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.finalizeText}>Commit to Pipeline</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

/* --- COMPONENTS --- */

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
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
            style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
            value={value || ""}
            onChangeText={setter}
            keyboardType={keyboardType}
            multiline={multiline}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
        />
    </View>
);

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
        backgroundColor: '#f1f5f9',
    },
    saveBtnTopText: {
        color: '#0f172a',
        fontWeight: '700',
        fontSize: 14,
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
    fieldLabel: {
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
    pillGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    pillActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    pillText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
    },
    pillTextActive: {
        color: 'white',
    },
    finalizeButton: {
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
    disabled: { opacity: 0.6 },
    finalizeText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 17,
    },
});
