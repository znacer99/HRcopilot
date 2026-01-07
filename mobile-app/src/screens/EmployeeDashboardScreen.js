import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
    Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import apiService from '../api/apiService';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { WebView } from 'react-native-webview';

// API BASE URL for downloads
const DEFAULT_BASE_URL = "http://192.168.1.11:5000";
const DOWNLOAD_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

export default function EmployeeDashboardScreen({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('home');
    const [leaves, setLeaves] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [colleagues, setColleagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fileLoading, setFileLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Preparing document...');

    // MODAL STATE
    const [modalVisible, setModalVisible] = useState(false);
    const [leaveType, setLeaveType] = useState('annual');
    const [reason, setReason] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // INLINE VIEWER STATE
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerUri, setViewerUri] = useState(null);
    const insets = useSafeAreaInsets();

    // PROFILE STATE
    const [profileData, setProfileData] = useState(null);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [updatingPhone, setUpdatingPhone] = useState(false);

    // PASSWORD STATE
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [leavesRes, docsRes, colleaguesRes, profileRes] = await Promise.allSettled([
                apiService.getLeaves(),
                apiService.getDocuments(),
                apiService.getEmployees(),
                apiService.getMe()
            ]);

            if (leavesRes.status === 'fulfilled' && leavesRes.value.success) {
                setLeaves(leavesRes.value.leaves);
            }
            if (docsRes.status === 'fulfilled' && docsRes.value.success) {
                setDocuments(docsRes.value.documents);
            }
            if (colleaguesRes.status === 'fulfilled' && colleaguesRes.value.success) {
                // Filter out self from colleagues
                setColleagues(colleaguesRes.value.employees.filter(emp => emp.full_name !== user.name));
            }
            if (profileRes.status === 'fulfilled' && profileRes.value.success) {
                setProfileData(profileRes.value);
                setNewPhone(profileRes.value.employee?.phone || '');
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLeave = async () => {
        if (!reason) {
            Alert.alert("Error", "Please provide a reason for the leave.");
            return;
        }

        try {
            setSubmitting(true);
            const data = {
                type: leaveType,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                reason: reason
            };
            const res = await apiService.createLeave(data);
            if (res.success) {
                Alert.alert("Success", "Leave request submitted successfully.");
                setModalVisible(false);
                setReason('');
                fetchAllData();
            }
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to submit leave request.");
        } finally {
            setSubmitting(false);
        }
    };

    const downloadDocument = async (doc) => {
        try {
            setLoadingText('Downloading...');
            setFileLoading(true);
            const token = await apiService.getToken();
            if (!token) {
                setFileLoading(false);
                Alert.alert("Auth error", "Please login again.");
                return;
            }

            // Decide endpoint based on source
            const endpoint = doc.source === 'employee'
                ? `/api/documents/employee/${doc.id}/download`
                : `/api/documents/user/${doc.id}/download`;

            const downloadUrl = `${DOWNLOAD_BASE_URL}${endpoint}`;
            const localPath = `${FileSystem.documentDirectory}${doc.filename}`;

            console.log("📥 DOWNLOADING FROM:", downloadUrl);

            const res = await FileSystem.downloadAsync(downloadUrl, localPath, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("📥 DOWNLOAD FINISHED:", res.uri);

            // Check if the file is actually a PDF (basic check)
            const info = await FileSystem.getInfoAsync(res.uri);
            if (!info.exists || info.size < 1000) {
                setFileLoading(false);
                // Likely an error page (JSON/HTML) rather than a real PDF
                console.warn("⚠️ Downloaded file seems suspiciously small:", info.size);
                // If it's small, it might be a JSON error. Let's try to read it.
                try {
                    const content = await FileSystem.readAsStringAsync(res.uri, { length: 500 });
                    if (content.includes("{\"success\":false") || content.includes("<!DOCTYPE html>")) {
                        Alert.alert("Download Error", "The server returned an error instead of the file. Please check logs.");
                        return;
                    }
                } catch (e) { }
            }

            setFileLoading(false);

            // Small delay to ensure the modal is fully gone before launching system sharing
            // This prevents iOS from ignoring the share call due to a "UI Transition" in progress
            setTimeout(async () => {
                try {
                    console.log("🚀 Attempting to share:", res.uri);
                    const canShare = await Sharing.isAvailableAsync();
                    if (canShare) {
                        await Sharing.shareAsync(res.uri);
                    } else {
                        await Linking.openURL(res.uri);
                    }
                } catch (err) {
                    console.error("❌ Sharing failed:", err);
                    Alert.alert("Share Error", "Could not open document viewer.");
                }
            }, 600);
        } catch (e) {
            setFileLoading(false);
            console.error("Download failed:", e);
            Alert.alert("Download failed", "Cannot download this document.");
        }
    };

    const previewDocument = async (doc) => {
        try {
            setLoadingText('Preparing preview...');
            setFileLoading(true);
            const token = await apiService.getToken();
            if (!token) {
                setFileLoading(false);
                Alert.alert("Error", "Auth token missing.");
                return;
            }

            const endpoint = doc.source === 'employee'
                ? `/api/documents/employee/${doc.id}/download?inline=1`
                : `/api/documents/user/${doc.id}/download?inline=1`;

            const downloadUrl = `${DOWNLOAD_BASE_URL}${endpoint}`;
            const localPath = `${FileSystem.cacheDirectory}view_${Date.now()}.pdf`;

            console.log("📥 Preview: Downloading from", downloadUrl);
            const res = await FileSystem.downloadAsync(downloadUrl, localPath, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("✅ Preview: Downloaded to", res.uri);

            // Verify file
            const info = await FileSystem.getInfoAsync(res.uri);
            if (!info.exists || info.size < 500) {
                setFileLoading(false);
                console.error("❌ Preview: File verification failed", info);
                Alert.alert("Error", "File could not be prepared (too small or missing).");
                return;
            }

            setFileLoading(false);

            // Open inline viewer instead of Share Sheet
            setViewerUri(res.uri);
            setViewerVisible(true);

        } catch (e) {
            setFileLoading(false);
            console.error("❌ Preview: Global failure", e);
            Alert.alert("System Error", "Failed to load document: " + e.message);
        }
    };

    const handleUpdatePhone = async () => {
        if (!newPhone) {
            Alert.alert("Error", "Phone number cannot be empty.");
            return;
        }
        try {
            setUpdatingPhone(true);
            const res = await apiService.updateProfile({ phone: newPhone });
            if (res.success) {
                Alert.alert("Success", "Phone number updated successfully.");
                setIsEditingPhone(false);
                // Refresh profile data
                const profileRes = await apiService.getMe();
                if (profileRes.success) {
                    setProfileData(profileRes);
                }
            }
        } catch (e) {
            Alert.alert("Error", "Failed to update phone number.");
        } finally {
            setUpdatingPhone(false);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Error", "New password must be at least 6 characters.");
            return;
        }

        try {
            setChangingPassword(true);
            const res = await apiService.changePassword(oldPassword, newPassword);
            if (res.success) {
                Alert.alert("Success", "Password changed successfully.");
                setPasswordModalVisible(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (e) {
            Alert.alert("Error", e.message || "Failed to change password.");
        } finally {
            setChangingPassword(false);
        }
    };

    // RENDER CONTENT
    const renderContent = () => {
        if (loading && activeTab !== 'profile') {
            return (
                <View style={[styles.center, { flex: 1 }]}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={{ marginTop: 10, color: '#666' }}>Syncing your portal...</Text>
                </View>
            );
        }

        switch (activeTab) {
            case 'home':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.welcomeCard}>
                            <Text style={styles.welcomeTitle}>Welcome, {user.name}</Text>
                            <Text style={styles.welcomeSubtitle}>{user.department || 'General'} Department</Text>
                            <Text style={styles.welcomeSubtitle}>Employee Portal</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => setModalVisible(true)}
                        >
                            <Feather name="plus" size={20} color="white" />
                            <Text style={styles.primaryButtonText}>Request Leave</Text>
                        </TouchableOpacity>

                        <View style={styles.sectionCard}>
                            <View style={styles.rowBetween}>
                                <Text style={styles.sectionTitle}>My Leave Requests</Text>
                                <TouchableOpacity onPress={fetchAllData} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Feather name="refresh-cw" size={16} color="#2563eb" />
                                </TouchableOpacity>
                            </View>

                            {leaves.length === 0 ? (
                                <Text style={styles.emptyText}>No leave requests found.</Text>
                            ) : (
                                leaves.slice(0, 5).map((leave) => (
                                    <View key={leave.id} style={styles.listItem}>
                                        <View style={styles.rowBetween}>
                                            <Text style={styles.itemTitle}>{leave.type.toUpperCase()}</Text>
                                            <View style={[styles.badge, leave.status === 'approved' ? styles.badgeGreen : (leave.status === 'pending' ? styles.badgeYellow : styles.badgeRed)]}>
                                                <Text style={[styles.badgeText, leave.status === 'approved' ? styles.textGreen : (leave.status === 'pending' ? styles.textYellow : styles.textRed)]}>
                                                    {leave.status}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.itemSubtitle}>{leave.start_date} to {leave.end_date}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                );

            case 'colleagues':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.sectionTitle}>My Team</Text>
                        {colleagues.length === 0 ? (
                            <Text style={styles.emptyText}>No team members found.</Text>
                        ) : (
                            colleagues.map((colleague) => (
                                <View key={colleague.id} style={styles.sectionCard}>
                                    <View style={styles.row}>
                                        <View style={styles.avatar}>
                                            <Feather name="user" size={20} color="#2563eb" />
                                        </View>
                                        <View>
                                            <Text style={styles.itemTitle}>{colleague.full_name}</Text>
                                            <Text style={styles.itemSubtitle}>{colleague.job_title}</Text>
                                            <Text style={styles.itemDate}>{colleague.department?.name}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                );

            case 'documents':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.sectionTitle}>My Documents</Text>
                        {documents.length === 0 ? (
                            <View style={styles.center}>
                                <Feather name="folder" size={48} color="#d1d5db" />
                                <Text style={styles.emptyText}>No documents found for you.</Text>
                            </View>
                        ) : (
                            documents.map((doc) => (
                                <View
                                    key={`${doc.source}-${doc.id}`}
                                    style={styles.docItemCard}
                                >
                                    <View style={styles.row}>
                                        <TouchableOpacity
                                            style={[styles.row, { flex: 1 }]}
                                            onPress={() => previewDocument(doc)}
                                        >
                                            <View style={styles.iconBox}>
                                                <Feather name="file-text" size={24} color="#2563eb" />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={styles.itemTitle} numberOfLines={1}>{doc.filename}</Text>
                                                <Text style={styles.itemSubtitle}>{doc.document_type} • {doc.source === 'employee' ? 'Official' : 'Personal'}</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                                            <TouchableOpacity
                                                onPress={() => previewDocument(doc)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Feather name="eye" size={22} color="#2563eb" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => downloadDocument(doc)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Feather name="download" size={22} color="#9ca3af" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                );

            case 'profile':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Profile Header */}
                        <View style={styles.profileHeader}>
                            <View style={styles.profileAvatarLarge}>
                                <Text style={styles.profileAvatarText}>
                                    {profileData?.user?.name ? profileData.user.name.split(' ').map(n => n[0]).join('') : user.name[0]}
                                </Text>
                            </View>
                            <Text style={styles.profileName}>{profileData?.user?.name || user.name}</Text>
                            <Text style={styles.profileRole}>{profileData?.employee?.job_title || 'Employee'}</Text>
                            <View style={styles.tagBadge}>
                                <Text style={styles.tagBadgeText}>{profileData?.employee?.department || 'General'} Dept</Text>
                            </View>
                        </View>

                        {/* Contact Information */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeaderLine}>
                                <Text style={styles.sectionTitle}>Contact Information</Text>
                                <Feather name="phone" size={16} color="#4b5563" />
                            </View>

                            <View style={styles.profileDetailItem}>
                                <View style={styles.profileDetailIcon}>
                                    <Feather name="mail" size={18} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileDetailLabel}>Email Address</Text>
                                    <Text style={styles.profileDetailValue}>{profileData?.user?.email || user.email}</Text>
                                </View>
                            </View>

                            <View style={styles.profileDetailItem}>
                                <View style={styles.profileDetailIcon}>
                                    <Feather name="phone" size={18} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileDetailLabel}>Phone Number</Text>
                                    {isEditingPhone ? (
                                        <View style={styles.editPhoneRow}>
                                            <TextInput
                                                style={styles.phoneInput}
                                                value={newPhone}
                                                onChangeText={setNewPhone}
                                                placeholder="Enter phone number"
                                                keyboardType="phone-pad"
                                            />
                                            <TouchableOpacity
                                                style={styles.phoneSaveBtn}
                                                onPress={handleUpdatePhone}
                                                disabled={updatingPhone}
                                            >
                                                {updatingPhone ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <Feather name="check" size={18} color="white" />
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.phoneCancelBtn}
                                                onPress={() => {
                                                    setIsEditingPhone(false);
                                                    setNewPhone(profileData?.employee?.phone || '');
                                                }}
                                            >
                                                <Feather name="x" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.displayPhoneRow}>
                                            <Text style={styles.profileDetailValue}>
                                                {profileData?.employee?.phone || 'Not set'}
                                            </Text>
                                            <TouchableOpacity onPress={() => setIsEditingPhone(true)}>
                                                <Feather name="edit-2" size={14} color="#2563EB" style={{ marginLeft: 8 }} />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Identity Details */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeaderLine}>
                                <Text style={styles.sectionTitle}>Identity Details</Text>
                                <Feather name="id-card" size={16} color="#4b5563" />
                            </View>

                            <View style={styles.profileDetailItem}>
                                <View style={styles.profileDetailIcon}>
                                    <Feather name="credit-card" size={18} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileDetailLabel}>{profileData?.employee?.id_type || 'Identity Card'}</Text>
                                    <Text style={styles.profileDetailValue}>{profileData?.employee?.id_number || 'Not provided'}</Text>
                                </View>
                            </View>

                            <View style={styles.profileDetailItem}>
                                <View style={styles.profileDetailIcon}>
                                    <Feather name="calendar" size={18} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileDetailLabel}>Birth Date</Text>
                                    <Text style={styles.profileDetailValue}>{profileData?.employee?.birth_date || 'Not set'}</Text>
                                </View>
                            </View>

                            <View style={styles.profileDetailItem}>
                                <View style={styles.profileDetailIcon}>
                                    <Feather name="flag" size={18} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileDetailLabel}>Nationality</Text>
                                    <Text style={styles.profileDetailValue}>{profileData?.employee?.nationality || 'Not specified'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Address Information */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeaderLine}>
                                <Text style={styles.sectionTitle}>Address Information</Text>
                                <Feather name="map-pin" size={16} color="#4b5563" />
                            </View>

                            <View style={styles.profileDetailItem}>
                                <View style={styles.profileDetailIcon}>
                                    <Feather name="home" size={18} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileDetailLabel}>Actual Address</Text>
                                    <Text style={styles.profileDetailValue}>{profileData?.employee?.address || 'Not specified'}</Text>
                                </View>
                            </View>

                            <View style={styles.profileDetailItem}>
                                <View style={styles.profileDetailIcon}>
                                    <Feather name="map" size={18} color="#2563EB" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.profileDetailLabel}>Mother Country Address</Text>
                                    <Text style={styles.profileDetailValue}>{profileData?.employee?.mother_country_address || 'Not specified'}</Text>
                                </View>
                            </View>

                            <View style={[styles.infoGrid, { marginTop: 8 }]}>
                                <View style={styles.infoGridItem}>
                                    <Text style={styles.infoGridLabel}>State/Province</Text>
                                    <Text style={styles.infoGridValue}>{profileData?.employee?.state || '-'}</Text>
                                </View>
                                <View style={styles.infoGridItem}>
                                    <Text style={styles.infoGridLabel}>Country</Text>
                                    <Text style={styles.infoGridValue}>{profileData?.employee?.country || '-'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Employment Details */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeaderLine}>
                                <Text style={styles.sectionTitle}>Employment Details</Text>
                                <Feather name="briefcase" size={16} color="#4b5563" />
                            </View>

                            <View style={styles.infoGrid}>
                                <View style={styles.infoGridItem}>
                                    <Text style={styles.infoGridLabel}>Department</Text>
                                    <Text style={styles.infoGridValue}>{profileData?.employee?.department || '-'}</Text>
                                </View>
                                <View style={styles.infoGridItem}>
                                    <Text style={styles.infoGridLabel}>Job Title</Text>
                                    <Text style={styles.infoGridValue}>{profileData?.employee?.job_title || '-'}</Text>
                                </View>
                                <View style={styles.infoGridItem}>
                                    <Text style={styles.infoGridLabel}>Position</Text>
                                    <Text style={styles.infoGridValue}>{profileData?.user?.position || 'Employee'}</Text>
                                </View>
                                <View style={styles.infoGridItem}>
                                    <Text style={styles.infoGridLabel}>Joined Date</Text>
                                    <Text style={styles.infoGridValue}>{profileData?.employee?.hire_date || '-'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Security */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Security</Text>
                            <TouchableOpacity
                                style={styles.securityAction}
                                onPress={() => setPasswordModalVisible(true)}
                            >
                                <Feather name="lock" size={18} color="#4b5563" />
                                <Text style={styles.securityActionText}>Change Password</Text>
                                <Feather name="chevron-right" size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                            <Feather name="log-out" size={20} color="white" />
                            <Text style={styles.logoutButtonText}>Sign Out from Portal</Text>
                        </TouchableOpacity>

                        {/* PASSWORD CHANGE MODAL */}
                        <Modal
                            visible={passwordModalVisible}
                            transparent={true}
                            animationType="slide"
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>Change Password</Text>
                                        <TouchableOpacity onPress={() => {
                                            setPasswordModalVisible(false);
                                            setOldPassword('');
                                            setNewPassword('');
                                            setConfirmPassword('');
                                        }}>
                                            <Feather name="x" size={24} color="#4b5563" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.modalBody}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Current Password</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={oldPassword}
                                                onChangeText={setOldPassword}
                                                secureTextEntry
                                                placeholder="••••••••"
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>New Password</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                secureTextEntry
                                                placeholder="••••••••"
                                            />
                                        </View>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.label}>Confirm New Password</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry
                                                placeholder="••••••••"
                                            />
                                        </View>

                                        <TouchableOpacity
                                            style={styles.submitBtn}
                                            onPress={handleChangePassword}
                                            disabled={changingPassword}
                                        >
                                            {changingPassword ? (
                                                <ActivityIndicator color="white" />
                                            ) : (
                                                <Text style={styles.submitBtnText}>Update Password</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </ScrollView>
                );

            default:
                return null;
        }
    };

    const TabButton = ({ id, label, icon }) => (
        <TouchableOpacity
            style={styles.tabButton}
            onPress={() => setActiveTab(id)}
            activeOpacity={0.7}
        >
            <Feather name={icon} size={24} color={activeTab === id ? '#2563eb' : '#9ca3af'} />
            <Text style={[styles.tabLabel, activeTab === id && styles.activeTabLabel]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>HR Copilot</Text>
                <Text style={styles.headerSubtitle}>{user.name}</Text>
            </View>

            <View style={styles.content}>
                {renderContent()}
            </View>

            <View style={styles.bottomNav}>
                <TabButton id="home" label="Home" icon="home" />
                <TabButton id="colleagues" label="Team" icon="users" />
                <TabButton id="documents" label="Docs" icon="file-text" />
                <TabButton id="profile" label="Profile" icon="user" />
            </View>

            {/* LEAVE MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Request Leave</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.label}>Leave Type</Text>
                            <View style={styles.typeRow}>
                                {['annual', 'sick', 'emergency'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.typeButton, leaveType === type && styles.typeButtonActive]}
                                        onPress={() => setLeaveType(type)}
                                    >
                                        <Text style={[styles.typeButtonText, leaveType === type && styles.typeButtonTextActive]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Start Date</Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                                <Text>{startDate.toLocaleDateString()}</Text>
                                <Feather name="calendar" size={18} color="#6b7280" />
                            </TouchableOpacity>
                            {showStartPicker && (
                                <DateTimePicker
                                    value={startDate}
                                    mode="date"
                                    onChange={(event, date) => {
                                        setShowStartPicker(false);
                                        if (date) setStartDate(date);
                                    }}
                                />
                            )}

                            <Text style={styles.label}>End Date</Text>
                            <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                                <Text>{endDate.toLocaleDateString()}</Text>
                                <Feather name="calendar" size={18} color="#6b7280" />
                            </TouchableOpacity>
                            {showEndPicker && (
                                <DateTimePicker
                                    value={endDate}
                                    mode="date"
                                    onChange={(event, date) => {
                                        setShowEndPicker(false);
                                        if (date) setEndDate(date);
                                    }}
                                />
                            )}

                            <Text style={styles.label}>Reason</Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                placeholder="Enter reason for leave..."
                                value={reason}
                                onChangeText={setReason}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, submitting && styles.disabledButton]}
                                onPress={handleCreateLeave}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Submit Request</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* FILE ACTION LOADING MODAL */}
            <Modal
                transparent={true}
                visible={fileLoading}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.loadingPopup}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={styles.loadingText}>{loadingText}</Text>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={viewerVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setViewerVisible(false)}
            >
                <View style={styles.viewerContainer}>
                    <View style={[styles.viewerHeader, { paddingTop: Math.max(insets.top, 10) }]}>
                        <TouchableOpacity
                            onPress={() => setViewerVisible(false)}
                            style={styles.closeBtn}
                            hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
                        >
                            <Feather name="x" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={styles.viewerTitle} numberOfLines={1}>Document Preview</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.webviewWrapper}>
                        {viewerUri && (
                            <WebView
                                source={{ uri: viewerUri }}
                                style={{ flex: 1 }}
                                originWhitelist={['*']}
                                scalesPageToFit={true}
                                bounces={false}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 12,
        paddingVertical: 16,
        paddingBottom: 100,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        height: 80,
        paddingBottom: 20,
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: 12,
        marginTop: 4,
        color: '#9ca3af',
    },
    activeTabLabel: {
        color: '#2563eb',
    },
    welcomeCard: {
        backgroundColor: '#2563eb',
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
    },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    welcomeSubtitle: {
        color: '#dbeafe',
        fontSize: 14,
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    sectionCard: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        marginBottom: 16,
    },
    docItemCard: {
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f3f4f6',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    listItem: {
        backgroundColor: '#f9fafb',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    iconBox: {
        width: 48,
        height: 48,
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#9ca3af',
    },
    itemDate: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeGreen: { backgroundColor: '#dcfce7' },
    badgeYellow: { backgroundColor: '#fef9c3' },
    badgeRed: { backgroundColor: '#fee2e2' },
    badgeText: { fontSize: 10, fontWeight: '600' },
    textGreen: { color: '#15803d' },
    textYellow: { color: '#a16207' },
    textRed: { color: '#b91c1c' },
    emptyText: {
        textAlign: 'center',
        color: '#9ca3af',
        marginVertical: 20,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e8edff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalForm: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    typeButtonText: {
        color: '#374151',
        fontSize: 13,
    },
    typeButtonTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#f9fafb',
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f9fafb',
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#9ca3af',
    },

    // NEW PROFILE STYLES
    profileHeader: {
        backgroundColor: 'white',
        padding: 24,
        alignItems: 'center',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    profileAvatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    profileAvatarText: {
        color: 'white',
        fontSize: 32,
        fontWeight: '700',
    },
    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    profileRole: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    tagBadge: {
        backgroundColor: '#e0f2fe',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 10,
    },
    tagBadgeText: {
        color: '#0369a1',
        fontSize: 12,
        fontWeight: '600',
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    profileDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f9fafb',
    },
    profileDetailIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    profileDetailLabel: {
        fontSize: 12,
        color: '#9ca3af',
        marginBottom: 2,
    },
    profileDetailValue: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    displayPhoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editPhoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    phoneInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    phoneSaveBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#10b981',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    phoneCancelBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    infoGridItem: {
        width: '50%',
        paddingHorizontal: 8,
        marginBottom: 16,
    },
    infoGridLabel: {
        fontSize: 11,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoGridValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
    },
    securityAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#f9fafb',
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    securityActionText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: '#dc2626',
        padding: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        width: '100%',
    },
    logoutButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    inputGroup: {
        marginBottom: 16,
    },

    // MODALS & VIEWER
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingPopup: {
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#374151',
        fontWeight: '500'
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: '#f3f4f6', // Light gray background for a modern feel
    },
    viewerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: 'white',
    },
    viewerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
        textAlign: 'center',
    },
    closeBtn: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    webviewWrapper: {
        flex: 1,
        marginHorizontal: 16, // Adds margins so the PDF isn't too wide
        marginTop: 16,
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    }
});
