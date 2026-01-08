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
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import apiService, { BASE_URL } from '../api/apiService';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { WebView } from 'react-native-webview';

import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';
import Card from '../components/Card';

// API BASE URL for downloads
const DOWNLOAD_BASE_URL = BASE_URL;

export default function EmployeeDashboardScreen({ user, onLogout }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const styles = getStyles(colors);
    const [activeTab, setActiveTab] = useState('home');
    const [leaves, setLeaves] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [colleagues, setColleagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fileLoading, setFileLoading] = useState(false);
    const [loadingText, setLoadingText] = useState('Preparing...');

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

    // REQUESTS STATE
    const [requests, setRequests] = useState([]);
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [reqCategory, setReqCategory] = useState('');
    const [reqSubject, setReqSubject] = useState('');
    const [reqMessage, setReqMessage] = useState('');
    const [reqSubmitting, setReqSubmitting] = useState(false);

    // MANAGER RESPONSE STATE
    const [managerResponseModalVisible, setManagerResponseModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [updatingRequest, setUpdatingRequest] = useState(false);

    const isManager = user?.role && ['it_manager', 'general_director', 'general_manager', 'head_of_department', 'manager'].includes(user.role);

    const categories = [
        { id: 'leave', name: 'Leave Request', icon: 'calendar' },
        { id: 'document', name: 'Document Request', icon: 'file-text' },
        { id: 'it-support', name: 'IT Support', icon: 'help-circle' },
        { id: 'hr-inquiry', name: 'HR Inquiry', icon: 'users' },
        { id: 'general', name: 'General Question', icon: 'message-square' },
        { id: 'other', name: 'Other', icon: 'alert-circle' },
    ];

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [leavesRes, docsRes, colleaguesRes, profileRes, requestsRes] = await Promise.allSettled([
                apiService.getLeaves(),
                apiService.getDocuments(),
                apiService.getEmployees(),
                apiService.getMe(),
                // If manager, fetch ALL requests, otherwise fetch own
                isManager ? apiService.fetchAllRequests() : apiService.fetchRequests()
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
            if (requestsRes.status === 'fulfilled' && requestsRes.value.success) {
                setRequests(requestsRes.value.requests);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!reqCategory || !reqSubject || !reqMessage) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setReqSubmitting(true);
        try {
            const res = await apiService.createRequest({
                category: categories.find(c => c.id === reqCategory)?.name || reqCategory,
                subject: reqSubject,
                message: reqMessage
            });

            if (res.success) {
                Alert.alert("Success", "Request submitted successfully");
                setRequestModalVisible(false);
                setReqCategory('');
                setReqSubject('');
                setReqMessage('');
                // Refresh requests
                const requestsRes = await apiService.fetchRequests();
                if (requestsRes.success) setRequests(requestsRes.requests);
            } else {
                Alert.alert("Error", res.message || "Failed to submit request");
            }
        } catch (error) {
            Alert.alert("Error", error.message || "Something went wrong");
        } finally {
            setReqSubmitting(false);
        }
    };

    const handleUpdateRequest = async () => {
        if (!selectedRequest) return;

        setUpdatingRequest(true);
        try {
            const res = await apiService.updateRequest(selectedRequest.id, {
                status: statusUpdate,
                response: responseMessage
            });

            if (res.success) {
                Alert.alert('Success', 'Request updated successfully');
                setManagerResponseModalVisible(false);
                setSelectedRequest(null);
                setResponseMessage('');
                // Refresh list
                const allReqsdRes = await apiService.fetchAllRequests();
                if (allReqsdRes.success) setRequests(allReqsdRes.requests);
            } else {
                Alert.alert('Error', res.message || 'Failed to update request');
            }
        } catch (error) {
            console.error('Update Request Error:', error);
            Alert.alert('Error', 'Failed to update request');
        } finally {
            setUpdatingRequest(false);
        }
    };

    const ProfileDetail = ({ label, value, icon }) => (
        <View style={styles.profileDetailItem}>
            <View style={styles.profileDetailIcon}>
                <Ionicons name={icon} size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.profileDetailLabel}>{label}</Text>
                <Text style={styles.profileDetailValue}>{value}</Text>
            </View>
        </View>
    );

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'time-outline';
            case 'in-progress': return 'flash-outline';
            case 'resolved': return 'checkmark-circle-outline';
            case 'closed': return 'lock-closed-outline';
            default: return 'help-circle-outline';
        }
    };

    const openManagerRequestModal = (req) => {
        setSelectedRequest(req);
        setStatusUpdate(req.status);
        setResponseMessage(req.response || '');
        setManagerResponseModalVisible(true);
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { bg: `${colors.warning}15`, text: colors.warning };
            case 'in-progress': return { bg: `${colors.accent}15`, text: colors.accent };
            case 'resolved': return { bg: `${colors.success}15`, text: colors.success };
            case 'closed': return { bg: colors.background, text: colors.textSecondary };
            default: return { bg: colors.background, text: colors.textSecondary };
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
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 10, color: colors.textSecondary }}>Syncing...</Text>
                </View>
            );
        }

        switch (activeTab) {
            case 'home':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.heroBanner}>
                            <View>
                                <Text style={styles.heroPreTitle}>Portal</Text>
                                <Text style={styles.heroTitle}>Hello, {user.name.split(' ')[0]}</Text>
                                <Text style={styles.heroSubtitle}>Overview</Text>
                            </View>
                            <View style={styles.heroIcon}>
                                <Ionicons name="stats-chart" size={32} color="white" />
                            </View>
                        </View>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.quickActionBtn}
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="white" />
                                <Text style={styles.quickActionText}>Request Leave</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Leaves</Text>
                                <TouchableOpacity onPress={fetchAllData} style={styles.refreshBtn}>
                                    <Ionicons name="refresh-outline" size={16} color={colors.accent} />
                                </TouchableOpacity>
                            </View>

                            {leaves.length === 0 ? (
                                <Text style={styles.emptyText}>No active leave records.</Text>
                            ) : (
                                leaves.slice(0, 5).map((leave) => (
                                    <View key={leave.id} style={styles.dataItem}>
                                        <View style={styles.itemHead}>
                                            <Text style={styles.itemType}>{leave.type.toUpperCase()}</Text>
                                            <View style={[styles.statusPill, { backgroundColor: getStatusStyle(leave.status).bg }]}>
                                                <Text style={[styles.statusPillText, { color: getStatusStyle(leave.status).text }]}>
                                                    {leave.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.itemRange}>{leave.start_date} → {leave.end_date}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                );

            case 'colleagues':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Team</Text>
                            {colleagues.length === 0 ? (
                                <Text style={styles.emptyText}>No records in scope.</Text>
                            ) : (
                                colleagues
                                    .filter(colleague => colleague.role === 'employee' || !colleague.role)
                                    .map((colleague) => (
                                        <View key={colleague.id} style={styles.colleagueCard}>
                                            <View style={styles.avatarBox}>
                                                <Ionicons name="person-outline" size={20} color={colors.accent} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.colleagueName}>{colleague.full_name}</Text>
                                                <Text style={styles.colleagueRole}>{colleague.job_title || 'Staff member'}</Text>
                                            </View>
                                            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                                        </View>
                                    ))
                            )}
                        </View>
                    </ScrollView>
                );

            case 'documents':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Files</Text>
                            {documents.length === 0 ? (
                                <View style={styles.emptyCenter}>
                                    <Ionicons name="folder-open-outline" size={48} color={colors.border} />
                                    <Text style={styles.emptyText}>Repository empty.</Text>
                                </View>
                            ) : (
                                documents.map((doc) => (
                                    <TouchableOpacity
                                        key={`${doc.source}-${doc.id}`}
                                        style={styles.docCard}
                                        onPress={() => previewDocument(doc)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.docIcon}>
                                            <Ionicons name="document-text-outline" size={22} color={colors.accent} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.docTitle} numberOfLines={1}>{doc.filename}</Text>
                                            <Text style={styles.docSubtitle}>{doc.document_type} • {doc.source === 'employee' ? 'Official' : 'Personal'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => downloadDocument(doc)}>
                                            <Ionicons name="cloud-download-outline" size={22} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </ScrollView>
                );

            case 'requests':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.heroBannerMini}>
                            <View>
                                <Text style={styles.heroTitle}>Requests</Text>
                                <Text style={styles.heroSubtitle}>{requests.length} Active</Text>
                            </View>
                            <TouchableOpacity style={styles.newRequestBtn} onPress={() => setRequestModalVisible(true)}>
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={styles.newRequestText}>New</Text>
                            </TouchableOpacity>
                        </View>

                        {requests.length === 0 ? (
                            <View style={styles.emptyCenter}>
                                <Ionicons name="chatbubbles-outline" size={48} color={colors.border} />
                                <Text style={styles.emptyText}>No requests found.</Text>
                            </View>
                        ) : (
                            requests.map((request) => (
                                <TouchableOpacity
                                    key={request.id}
                                    style={styles.requestCard}
                                    onPress={() => isManager ? openManagerRequestModal(request) : null}
                                    activeOpacity={isManager ? 0.7 : 1}
                                >
                                    <View style={styles.itemHead}>
                                        <View style={[styles.statusPill, { backgroundColor: getStatusStyle(request.status).bg }]}>
                                            <Ionicons name={getStatusIcon(request.status)} size={10} color={getStatusStyle(request.status).text} style={{ marginRight: 4 }} />
                                            <Text style={[styles.statusPillText, { color: getStatusStyle(request.status).text }]}>
                                                {request.status.toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={styles.cardDate}>{request.date}</Text>
                                    </View>

                                    <Text style={styles.caseSubject}>{request.subject}</Text>
                                    <Text style={styles.caseMessage} numberOfLines={2}>{request.message}</Text>

                                    {request.response && (
                                        <View style={styles.responseNote}>
                                            <Text style={styles.responseText}>{request.response}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                );

            case 'profile':
                return (
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.profileHero}>
                            <View style={styles.avatarLarge}>
                                <Text style={styles.avatarLargeText}>
                                    {profileData?.user?.name ? profileData.user.name.split(' ').map(n => n[0]).join('') : user.name[0]}
                                </Text>
                            </View>
                            <Text style={styles.profileName}>{profileData?.user?.name || user.name}</Text>
                            <Text style={styles.profileRole}>{profileData?.employee?.job_title || 'Staff'}</Text>
                        </View>

                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Personal</Text>
                            <ProfileDetail label="Email" value={profileData?.user?.email || user.email} icon="mail-outline" />
                            <ProfileDetail label="Phone" value={profileData?.employee?.phone || 'Not set'} icon="call-outline" />
                            <ProfileDetail label="ID" value={profileData?.employee?.id_number || 'Pending'} icon="id-card-outline" />
                        </View>

                        <TouchableOpacity style={styles.logoutAction} onPress={onLogout}>
                            <Text style={styles.logoutActionText}>Sign Out</Text>
                        </TouchableOpacity>
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
            <Ionicons
                name={activeTab === id ? icon : `${icon}-outline`}
                size={22}
                color={activeTab === id ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.tabLabel, activeTab === id && styles.activeTabLabel]}>
                {label}
            </Text>
            {activeTab === id && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainHeader}>
                <View>
                    <Text style={styles.headerBrand}>COPILOT</Text>
                    <Text style={styles.headerRole}>{user.role?.toUpperCase() || 'STAFF'} PORTAL</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={toggleTheme} style={styles.headerRefresh}>
                        <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={fetchAllData} style={styles.headerRefresh}>
                        <Ionicons name="notifications-outline" size={22} color={colors.text} />
                        <View style={styles.notifBadge} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.mainContent}>
                {renderContent()}
            </View>

            <View style={styles.bottomBar}>
                <TabButton id="home" label="Home" icon="grid" />
                <TabButton id="colleagues" label="Team" icon="people" />

                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => setActiveTab('requests')}
                    activeOpacity={0.7}
                >
                    <View>
                        <Ionicons
                            name={activeTab === 'requests' ? "chatbox" : "chatbox-outline"}
                            size={22}
                            color={activeTab === 'requests' ? colors.accent : colors.textSecondary}
                        />
                        {requests.filter(r => r.status === 'pending').length > 0 && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>
                                    {requests.filter(r => r.status === 'pending').length}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.tabLabel, activeTab === 'requests' && styles.activeTabLabel]}>
                        Center
                    </Text>
                    {activeTab === 'requests' && <View style={styles.activeIndicator} />}
                </TouchableOpacity>

                <TabButton id="documents" label="Docs" icon="folder" />
                <TabButton id="profile" label="Profile" icon="person" />
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

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
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

            {/* REQUEST MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={requestModalVisible}
                onRequestClose={() => setRequestModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Request</Text>
                            <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Category</Text>
                            <View style={[styles.infoGrid, { marginHorizontal: -4 }]}>
                                {categories.map((cat) => (
                                    <View key={cat.id} style={{ width: '50%', padding: 4 }}>
                                        <TouchableOpacity
                                            style={[styles.typeButton, reqCategory === cat.id && styles.typeButtonActive, { flexDirection: 'column', height: 80, justifyContent: 'center' }]}
                                            onPress={() => setReqCategory(cat.id)}
                                        >
                                            <Feather name={cat.icon} size={24} color={reqCategory === cat.id ? 'white' : '#6b7280'} style={{ marginBottom: 8 }} />
                                            <Text style={[styles.typeButtonText, reqCategory === cat.id && styles.typeButtonTextActive, { fontSize: 12 }]}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <Text style={styles.label}>Subject</Text>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="Brief description"
                                value={reqSubject}
                                onChangeText={setReqSubject}
                            />

                            <Text style={styles.label}>Message</Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                placeholder="Detailed explanation..."
                                value={reqMessage}
                                onChangeText={setReqMessage}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, reqSubmitting && styles.disabledButton]}
                                onPress={handleCreateRequest}
                                disabled={reqSubmitting}
                            >
                                {reqSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Submit Request</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MANAGER RESPONSE MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={managerResponseModalVisible}
                onRequestClose={() => setManagerResponseModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Request</Text>
                            <TouchableOpacity onPress={() => setManagerResponseModalVisible(false)}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            {selectedRequest && (
                                <View style={styles.requestDetailBlock}>
                                    <Text style={styles.requestDetailTitle}>Subject</Text>
                                    <Text style={styles.requestDetailText}>{selectedRequest.subject}</Text>

                                    <Text style={[styles.requestDetailTitle, { marginTop: 12 }]}>Employee</Text>
                                    <Text style={styles.requestDetailText}>{selectedRequest.user?.name || 'Unknown'}</Text>

                                    <Text style={[styles.requestDetailTitle, { marginTop: 12 }]}>Message</Text>
                                    <View style={styles.messageBox}>
                                        <Text style={styles.messageText}>{selectedRequest.message}</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.label}>Status</Text>
                            <View style={styles.typeRow}>
                                {['pending', 'in-progress', 'resolved'].map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[styles.typeButton, statusUpdate === st && styles.typeButtonActive]}
                                        onPress={() => setStatusUpdate(st)}
                                    >
                                        <Text style={[styles.typeButtonText, statusUpdate === st && styles.typeButtonTextActive, { fontSize: 12 }]}>
                                            {st === 'in-progress' ? 'In Progress' : st.charAt(0).toUpperCase() + st.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Response Message</Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                placeholder="Write a response to the employee..."
                                value={responseMessage}
                                onChangeText={setResponseMessage}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, updatingRequest && styles.disabledButton]}
                                onPress={handleUpdateRequest}
                                disabled={updatingRequest}
                            >
                                {updatingRequest ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Update Request</Text>}
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
                <View style={styles.centerModalOverlay}>
                    <View style={styles.loadingPopup}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={styles.loadingText}>{loadingText}</Text>
                    </View>
                </View>
            </Modal>

            {/* INLINE DOCUMENT VIEWER */}
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

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 10,
        paddingBottom: Spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerBrand: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primary,
        letterSpacing: 1.5,
    },
    headerRole: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 1,
        marginTop: -2,
    },
    headerRefresh: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    notifBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
        borderWidth: 1.5,
        borderColor: colors.background,
    },
    mainContent: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    heroBanner: {
        backgroundColor: colors.primary,
        padding: 24,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        borderRadius: Radius.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...Shadow.medium,
    },
    heroPreTitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: '800',
        marginVertical: 4,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
    },
    heroIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionRow: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.md,
    },
    quickActionBtn: {
        backgroundColor: colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: Radius.lg,
        gap: 10,
        ...Shadow.medium,
    },
    quickActionText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 15,
    },
    sectionCard: {
        backgroundColor: colors.surface,
        marginHorizontal: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        ...Typography.h3,
        color: colors.text,
    },
    refreshBtn: {
        padding: 4,
    },
    dataItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    itemHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemType: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: 0.5,
    },
    itemRange: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: '800',
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        paddingVertical: 20,
        fontSize: 14,
    },

    // Colleagues / Team
    sectionContainer: {
        padding: Spacing.lg,
    },
    colleagueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: Radius.lg,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    avatarBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    colleagueName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    colleagueRole: {
        fontSize: 12,
        color: colors.textSecondary,
    },

    // Documents
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: Radius.lg,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    docIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    docSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    emptyCenter: {
        alignItems: 'center',
        marginTop: 60,
        gap: 12,
    },

    // Profile
    profileHero: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    profileAvatarWrapper: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.medium,
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.accent,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    profName: {
        ...Typography.h2,
        color: colors.text,
    },
    profRole: {
        color: colors.textSecondary,
        fontWeight: '600',
        marginTop: 4,
    },
    profileCard: {
        backgroundColor: colors.surface,
        margin: Spacing.lg,
        padding: Spacing.lg,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    profileDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    profileDetailIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    profileDetailLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '700',
    },
    profileDetailValue: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '600',
        marginTop: 2,
    },
    logoutAction: {
        marginHorizontal: Spacing.lg,
        marginTop: 10,
        marginBottom: 40,
        padding: 16,
        borderRadius: Radius.lg,
        backgroundColor: colors.error + '10',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.error + '20',
    },
    logoutActionText: {
        color: colors.error,
        fontWeight: '700',
        fontSize: 15,
    },

    // Bottom Bar
    bottomBar: {
        flexDirection: 'row',
        height: 70,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: 10,
    },
    tabButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        color: colors.textSecondary,
    },
    activeTabLabel: {
        color: colors.accent,
    },
    activeIndicator: {
        position: 'absolute',
        top: 0,
        width: 24,
        height: 3,
        backgroundColor: colors.accent,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        ...Typography.h2,
        color: colors.text,
    },
    modalForm: {
        marginBottom: 20,
    },
    label: {
        ...Typography.body,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
        marginTop: 16,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 8,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: Radius.md,
        backgroundColor: colors.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    typeButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    typeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    typeButtonTextActive: {
        color: 'white',
        fontWeight: '700',
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: Radius.md,
        backgroundColor: colors.background,
    },
    textArea: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: Radius.md,
        padding: 14,
        backgroundColor: colors.background,
        height: 100,
        textAlignVertical: 'top',
        color: colors.text,
        ...Typography.body,
    },
    submitButton: {
        backgroundColor: colors.accent,
        padding: 16,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginTop: 24,
        ...Shadow.medium,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: colors.border,
        opacity: 0.6,
    },
    centerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingPopup: {
        backgroundColor: colors.surface,
        padding: 32,
        borderRadius: Radius.xl,
        alignItems: 'center',
        ...Shadow.medium,
    },
    loadingText: {
        marginTop: 16,
        ...Typography.body,
        color: colors.text,
        fontWeight: '600',
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    viewerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
    },
    viewerTitle: {
        ...Typography.h3,
        fontSize: 16,
        color: colors.text,
        flex: 1,
        textAlign: 'center',
    },
    closeBtn: {
        padding: 8,
        borderRadius: Radius.full,
        backgroundColor: colors.background,
    },
    webviewWrapper: {
        flex: 1,
        margin: 16,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    phoneInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: 14,
        height: 48,
        color: colors.text,
        ...Typography.body,
    },
    // REQUEST DETAIL STYLES
    requestDetailBlock: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: Radius.lg,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    requestDetailTitle: {
        ...Typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    requestDetailText: {
        ...Typography.body,
        fontWeight: '600',
        color: colors.text,
    },
    messageBox: {
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: Radius.md,
        marginTop: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    messageText: {
        ...Typography.body,
        fontStyle: 'italic',
        color: colors.textSecondary,
    },
});
