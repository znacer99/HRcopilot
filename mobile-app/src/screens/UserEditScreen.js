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
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';
import Button from '../components/Button';

/**
 * User Edit Screen - Create or Update a system user
 */
export default function UserEditScreen({ navigation, route }) {
    const { userId } = route.params || {};
    const isEdit = !!userId;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
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
            Alert.alert("Validation", "Please fill in all required fields (Name, Email, Password)");
            return;
        }

        setSaving(true);
        try {
            let response;
            if (isEdit) {
                // Update
                response = await apiService.updateUser(userId, form);
            } else {
                // Create
                response = await apiService.createUser(form);
            }

            if (response.success) {
                Alert.alert("Success", `User ${isEdit ? 'updated' : 'created'} successfully`, [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to save user");
        } finally {
            setSaving(false);
        }
    };

    const roles = [
        { label: 'Employee', value: 'employee' },
        { label: 'Manager', value: 'manager' },
        { label: 'IT Manager', value: 'it_manager' },
        { label: 'General Director', value: 'general_director' },
        { label: 'Director', value: 'director' }
    ];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? 'Edit User' : 'New User'}</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.formContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Basic Information</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.name}
                                onChangeText={(text) => setForm({ ...form, name: text })}
                                placeholder="John Doe"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email Address *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.email}
                                onChangeText={(text) => setForm({ ...form, email: text })}
                                placeholder="john@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>
                                {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
                            </Text>
                            <TextInput
                                style={styles.input}
                                value={form.password}
                                onChangeText={(text) => setForm({ ...form, password: text })}
                                placeholder="••••••••"
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>Roles & Position</Text>

                        <Text style={styles.inputLabel}>Role</Text>
                        <View style={styles.rolesRow}>
                            {roles.map((role) => (
                                <TouchableOpacity
                                    key={role.value}
                                    style={[
                                        styles.roleOption,
                                        form.role === role.value && styles.roleOptionActive
                                    ]}
                                    onPress={() => setForm({ ...form, role: role.value })}
                                >
                                    <Text style={[
                                        styles.roleOptionText,
                                        form.role === role.value && styles.roleOptionTextActive
                                    ]}>{role.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Position Title</Text>
                            <TextInput
                                style={styles.input}
                                value={form.position}
                                onChangeText={(text) => setForm({ ...form, position: text })}
                                placeholder="Senior Engineer"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={form.phone}
                                onChangeText={(text) => setForm({ ...form, phone: text })}
                                placeholder="+1 234 567 890"
                                keyboardType="phone-pad"
                            />
                        </View>

                        {!isEdit && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Access Code (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.access_code}
                                    onChangeText={(text) => setForm({ ...form, access_code: text })}
                                    placeholder="Leave blank to auto-generate"
                                    autoCapitalize="characters"
                                />
                            </View>
                        )}
                    </View>

                    {isEdit && (
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Status</Text>
                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={() => setForm({ ...form, is_active: !form.is_active })}
                            >
                                <Text style={styles.toggleLabel}>Account Active</Text>
                                <Ionicons
                                    name={form.is_active ? "toggle" : "toggle-outline"}
                                    size={32}
                                    color={form.is_active ? "#10b981" : "#d1d5db"}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.buttonRow}>
                        <Button
                            variant="primary"
                            title={saving ? "Saving..." : (isEdit ? "Update User" : "Create User")}
                            onPress={handleSave}
                            loading={saving}
                            fullWidth
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: {
        padding: 4,
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContent: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    rolesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    roleOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
        backgroundColor: 'white',
    },
    roleOptionActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    roleOptionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4b5563',
    },
    roleOptionTextActive: {
        color: 'white',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    buttonRow: {
        marginTop: 20,
        marginBottom: 40,
    }
});
