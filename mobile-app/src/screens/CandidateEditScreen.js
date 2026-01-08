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
 * Candidate Edit Screen - HR 2026 Redesign
 * Logical grouping of fields into visual modules for better UX
 */
export default function CandidateEditScreen({ route, navigation, user }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const { candidate } = route.params || {};
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
            if (res?.success) setDepartments(res.departments || []);
        } catch (err) {
            console.log("Metadata fetch failed", err);
        }
    };

    const handleSave = async () => {
        const isPrivileged = ['it_manager', 'general_director', 'manager'].includes(user?.role?.toLowerCase());
        if (!isPrivileged) {
            Alert.alert("Permission Denied", "You are not authorized to create or modify talent records.");
            return;
        }

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

            Alert.alert("Success", `Lead record ${isEdit ? 'updated' : 'captured'}!`, [
                {
                    text: "Confirm",
                    onPress: () => {
                        navigation.goBack();
                    },
                },
            ]);
        } catch (err) {
            Alert.alert("System Error", err.message || "Could not save recruitment data.");
        } finally {
            setSaving(false);
        }
    };

    const styles = getStyles(colors);

    const InputField = ({ label, value, onChange, placeholder, keyboardType = 'default', multiline = false }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                keyboardType={keyboardType}
                multiline={multiline}
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
                    <Text style={styles.headerTitle}>{isEdit ? "Refine Lead" : "New Talent Lead"}</Text>
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
                            <Text style={styles.sectionTitle}>Talent Profile</Text>
                        </View>
                        <InputField label="Candidate Name *" value={fullName} onChange={setFullName} placeholder="e.g. Sarah Jenkins" />
                        <InputField label="Applied Position *" value={position} onChange={setPosition} placeholder="e.g. Design Lead" />
                        <InputField label="Primary Domain" value={specialty} onChange={setSpecialty} placeholder="e.g. Product Design" />
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="call-outline" size={18} color={colors.accent} />
                            <Text style={styles.sectionTitle}>Contact Channels</Text>
                        </View>
                        <InputField label="Email Address" value={email} onChange={setEmail} placeholder="candidate@example.com" keyboardType="email-address" />
                        <InputField label="Direct Phone" value={phone} onChange={setPhone} placeholder="+1 000 000 000" keyboardType="phone-pad" />
                        <InputField label="Nationality" value={nationality} onChange={setNationality} placeholder="e.g. American" />
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="document-text-outline" size={18} color={colors.accent} />
                            <Text style={styles.sectionTitle}>Background & Skills</Text>
                        </View>
                        <InputField label="Experience Overview" value={experience} onChange={setExperience} placeholder="Summary of career history..." multiline />
                        <InputField label="Education Level" value={education} onChange={setEducation} placeholder="Highest degree attained..." />
                        <InputField label="Technical Skills" value={skills} onChange={setSkills} placeholder="List primary stacks..." multiline />
                    </View>

                    <Button
                        variant="primary"
                        title={saving ? "" : (isEdit ? "Update Lead" : "Capture Talent")}
                        loading={saving}
                        onPress={handleSave}
                        style={{ marginTop: 20 }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
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
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingVertical: 12,
    },
});
