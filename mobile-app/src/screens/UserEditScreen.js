import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';

/**
 * Shared Input Component - Defined outside to prevent focus loss on re-render
 */
const InputField = ({ label, value, onChange, placeholder, colors, secure = false, keyboardType = 'default', autoCapitalize = 'sentences' }) => (
    <View style={sharedStyles.inputContainer}>
        <Text style={sharedStyles.inputLabel}>{label}</Text>
        <TextInput
            style={sharedStyles.input}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={secure}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
        />
    </View>
);

/**
 * User Edit Screen - HR 2026 Redesign
 */
export default function UserEditScreen({ navigation, route }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const { userId } = route.params || {};
    const isEdit = !!userId;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [linking, setLinking] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        phone: '',
        position: '',
        access_code: '',
        is_active: true
    });

    useEffect(() => {
        if (isEdit) {
            fetchUserDetails();
        }
    }, [isEdit]);

    const fetchUserDetails = async () => {
        try {
            const response = await apiService.getUser(userId);
            if (response.success) {
                setForm({
                    ...response.user,
                    password: '' // Don't show hashed password
                });
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load user details");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.email || (!isEdit && !form.password)) {
            Alert.alert("Validation", "Required fields: Name, Email, Password");
            return;
        }

        setSaving(true);
        try {
            let response;
            if (isEdit) {
                response = await apiService.updateUser(userId, form);
            } else {
                response = await apiService.createUser(form);
            }

            if (response.success) {
                Alert.alert("Success", `Account ${isEdit ? 'updated' : 'provisioned'}!`, [
                    { text: "Confirm", onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to save user");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateHRRecord = async () => {
        setLinking(true);
        try {
            const res = await apiService.createEmployeeFromUser(userId);
            if (res.success) {
                Alert.alert("Registry Sync", "A new employee record has been generated and linked.");
                fetchUserDetails();
            }
        } catch (e) {
            Alert.alert("Linkage Failure", e.message);
        } finally {
            setLinking(false);
        }
    };

    const handleLinkExisting = () => {
        Alert.prompt(
            "Link Employee",
            "Enter the Employee ID code to link this account.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Link",
                    onPress: async (empId) => {
                        if (!empId) return;
                        setLinking(true);
                        try {
                            const res = await apiService.linkUserToEmployee(userId, empId);
                            if (res.success) {
                                Alert.alert("Success", "Account linkage established.");
                                fetchUserDetails();
                            }
                        } catch (e) {
                            Alert.alert("Error", e.message);
                        } finally {
                            setLinking(false);
                        }
                    }
                }
            ],
            "plain-text"
        );
    };

    const handleUnlink = () => {
        Alert.alert(
            "Unlink Account",
            "Are you sure you want to remove the connection to this HR record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove Link",
                    style: "destructive",
                    onPress: async () => {
                        setLinking(true);
                        try {
                            const res = await apiService.unlinkUserFromEmployee(userId);
                            if (res.success) {
                                Alert.alert("Success", "Linkage removed.");
                                fetchUserDetails();
                            }
                        } catch (e) {
                            Alert.alert("Error", e.message);
                        } finally {
                            setLinking(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSync = async () => {
        setLinking(true);
        try {
            const res = await apiService.syncUserWithEmployee(userId);
            if (res.success) {
                Alert.alert("Sync Complete", "Registry data pushed to HR record.");
                fetchUserDetails();
            }
        } catch (e) {
            Alert.alert("Sync Error", e.message);
        } finally {
            setLinking(false);
        }
    };

    const roles = [
        { label: 'Employee', value: 'employee' },
        { label: 'Manager', value: 'manager' },
        { label: 'IT Admin', value: 'it_manager' },
        { label: 'Director', value: 'general_director' }
    ];

    const styles = getStyles(colors);

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }


    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTitleBox}>
                    <Text style={styles.headerTitle}>{isEdit ? "Refine Account" : "Access Provisioning"}</Text>
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
                            <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
                            <Text style={styles.sectionTitle}>System Credentials</Text>
                        </View>
                        <InputField label="Profile Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Ex: Alex Rivera" colors={colors} />
                        <InputField label="Official Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v.trim() })} placeholder="alex@company.com" keyboardType="email-address" autoCapitalize="none" colors={colors} />
                        <InputField label={isEdit ? "New Password (Optional)" : "System Password *"} value={form.password} onChange={(v) => setForm({ ...form, password: v.trim() })} placeholder="••••••••" secure autoCapitalize="none" colors={colors} />
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="options-outline" size={18} color={colors.accent} />
                            <Text style={styles.sectionTitle}>Access Level</Text>
                        </View>
                        <View style={styles.roleGrid}>
                            {roles.map((r) => (
                                <TouchableOpacity
                                    key={r.value}
                                    style={[styles.roleBtn, form.role === r.value && styles.roleBtnActive]}
                                    onPress={() => setForm({ ...form, role: r.value })}
                                >
                                    <Text style={[styles.roleBtnText, form.role === r.value && styles.roleBtnActiveText]}>{r.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="construct-outline" size={18} color={colors.accent} />
                            <Text style={styles.sectionTitle}>Extended Registry</Text>
                        </View>
                        <InputField label="Position Code" value={form.position} onChange={(v) => setForm({ ...form, position: v })} placeholder="Ex: HR-01" colors={colors} />
                        <InputField label="Security Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+1..." keyboardType="phone-pad" colors={colors} />

                        <View style={styles.toggleRow}>
                            <Text style={styles.statusLabel}>Account Status</Text>
                            <TouchableOpacity
                                style={[styles.statusToggle, { backgroundColor: form.is_active ? colors.success : colors.error }]}
                                onPress={() => setForm({ ...form, is_active: !form.is_active })}
                            >
                                <Text style={styles.statusToggleText}>{form.is_active ? "ACTIVE" : "SUSPENDED"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="link-outline" size={18} color={colors.accent} />
                            <Text style={styles.sectionTitle}>HR Record Connectivity</Text>
                        </View>

                        {form.employee ? (
                            <View style={styles.linkedBox}>
                                <View style={styles.linkedInfo}>
                                    <Text style={styles.linkedLabel}>LINKED RECORD</Text>
                                    <Text style={styles.linkedName}>{form.employee.full_name}</Text>
                                    <Text style={styles.linkedId}>Record ID: #{form.employee.id}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.viewEmpBtn}
                                    onPress={() => navigation.navigate('EmployeeDetail', { employeeId: form.employee.id })}
                                >
                                    <Text style={styles.viewEmpText}>View Record</Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                                </TouchableOpacity>

                                <View style={styles.linkActionsOverlay}>
                                    <TouchableOpacity
                                        style={[styles.miniActionBtn, { backgroundColor: `${colors.success}15` }]}
                                        onPress={handleSync}
                                        disabled={linking}
                                    >
                                        <Ionicons name="sync-outline" size={16} color={colors.success} />
                                        <Text style={[styles.miniActionText, { color: colors.success }]}>Sync</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.miniActionBtn, { backgroundColor: `${colors.error}15` }]}
                                        onPress={handleUnlink}
                                        disabled={linking}
                                    >
                                        <Ionicons name="link-outline" size={16} color={colors.error} />
                                        <Text style={[styles.miniActionText, { color: colors.error }]}>Unlink</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.unlinkedState}>
                                <Text style={styles.unlinkedText}>This user account is not connected to a physical HR employee record.</Text>
                                <View style={styles.linkActions}>
                                    <TouchableOpacity
                                        style={styles.linkActionBtn}
                                        onPress={handleCreateHRRecord}
                                        disabled={linking}
                                    >
                                        <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                                        <Text style={styles.linkActionText}>Create New Record</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.linkActionBtn}
                                        onPress={handleLinkExisting}
                                        disabled={linking}
                                    >
                                        <Ionicons name="link-outline" size={20} color={colors.accent} />
                                        <Text style={styles.linkActionText}>Link Existing</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    <Button
                        variant="primary"
                        title={saving ? "" : (isEdit ? "Update Registry" : "Provision Access")}
                        loading={saving}
                        onPress={handleSave}
                        style={{ marginTop: 20 }}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const sharedStyles = {
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666', // Fallback, will be overridden by style prop if needed
        marginBottom: 8,
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 14,
        height: 48,
        fontSize: 15,
    },
};

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    roleBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
    },
    roleBtnActive: {
        borderColor: colors.accent,
        backgroundColor: `${colors.accent}15`,
    },
    roleBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    roleBtnActiveText: {
        color: colors.accent,
        fontWeight: '700',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    statusToggle: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        ...Shadow.subtle,
    },
    statusToggleText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    linkedBox: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
    },
    linkedInfo: {
        flex: 1,
    },
    linkedLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.accent,
        letterSpacing: 1,
        marginBottom: 4,
    },
    linkedName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    linkedId: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    viewEmpBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewEmpText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.accent,
    },
    unlinkedState: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border,
    },
    unlinkedText: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
        marginBottom: 16,
    },
    linkActions: {
        flexDirection: 'row',
        gap: 12,
    },
    linkActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
    },
    linkActionText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },
    linkActionsOverlay: {
        position: 'absolute',
        top: -45,
        right: 0,
        flexDirection: 'row',
        gap: 8,
    },
    miniActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    miniActionText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
});
