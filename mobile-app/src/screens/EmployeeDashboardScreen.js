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

import { Colors, Spacing, Radius, Shadow, Typography } from '../styles/theme';
import styles from '../styles/styles';
import Button from '../components/Button';
import Card from '../components/Card';

// API BASE URL for downloads
const DOWNLOAD_BASE_URL = BASE_URL;

export default function EmployeeDashboardScreen({ user, onLogout }) {
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
        <View style={localStyles.profileDetailItem}>
            <View style={localStyles.profileDetailIcon}>
                <Ionicons name={icon} size={18} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={localStyles.profileDetailLabel}>{label}</Text>
                <Text style={localStyles.profileDetailValue}>{value}</Text>
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
            case 'pending': return { bg: `${Colors.warning}15`, text: Colors.warning };
            case 'in-progress': return { bg: `${Colors.accent}15`, text: Colors.accent };
            case 'resolved': return { bg: `${Colors.success}15`, text: Colors.success };
            case 'closed': return { bg: Colors.background, text: Colors.textSecondary };
            default: return { bg: Colors.background, text: Colors.textSecondary };
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
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Syncing...</Text>
                </View>
            );
        }

        switch (activeTab) {
            case 'home':
                return (
                    <ScrollView contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={localStyles.heroBanner}>
                            <View>
                                <Text style={localStyles.heroPreTitle}>Portal</Text>
                                <Text style={localStyles.heroTitle}>Hello, {user.name.split(' ')[0]}</Text>
                                <Text style={localStyles.heroSubtitle}>Overview</Text>
                            </View>
                            <View style={localStyles.heroIcon}>
                                <Ionicons name="stats-chart" size={32} color="white" />
                            </View>
                        </View>

                        <View style={localStyles.actionRow}>
                            <TouchableOpacity
                                style={localStyles.quickActionBtn}
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="white" />
                                <Text style={localStyles.quickActionText}>Request Leave</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={localStyles.sectionCard}>
                            <View style={localStyles.sectionHeader}>
                                <Text style={localStyles.sectionTitle}>Leaves</Text>
                                <TouchableOpacity onPress={fetchAllData} style={localStyles.refreshBtn}>
                                    <Ionicons name="refresh-outline" size={16} color={Colors.accent} />
                                </TouchableOpacity>
                            </View>

                            {leaves.length === 0 ? (
                                <Text style={localStyles.emptyText}>No active leave records.</Text>
                            ) : (
                                leaves.slice(0, 5).map((leave) => (
                                    <View key={leave.id} style={localStyles.dataItem}>
                                        <View style={localStyles.itemHead}>
                                            <Text style={localStyles.itemType}>{leave.type.toUpperCase()}</Text>
                                            <View style={[localStyles.statusPill, { backgroundColor: getStatusStyle(leave.status).bg }]}>
                                                <Text style={[localStyles.statusPillText, { color: getStatusStyle(leave.status).text }]}>
                                                    {leave.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={localStyles.itemRange}>{leave.start_date} → {leave.end_date}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                );

            case 'colleagues':
                return (
                    <ScrollView contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={localStyles.sectionContainer}>
                            <Text style={localStyles.sectionTitle}>Team</Text>
                            {colleagues.length === 0 ? (
                                <Text style={localStyles.emptyText}>No records in scope.</Text>
                            ) : (
                                colleagues
                                    .filter(colleague => colleague.role === 'employee' || !colleague.role)
                                    .map((colleague) => (
                                        <View key={colleague.id} style={localStyles.colleagueCard}>
                                            <View style={localStyles.avatarBox}>
                                                <Ionicons name="person-outline" size={20} color={Colors.accent} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={localStyles.colleagueName}>{colleague.full_name}</Text>
                                                <Text style={localStyles.colleagueRole}>{colleague.job_title || 'Staff member'}</Text>
                                            </View>
                                            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
                                        </View>
                                    ))
                            )}
                        </View>
                    </ScrollView>
                );

            case 'documents':
                return (
                    <ScrollView contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={localStyles.sectionContainer}>
                            <Text style={localStyles.sectionTitle}>Files</Text>
                            {documents.length === 0 ? (
                                <View style={localStyles.emptyCenter}>
                                    <Ionicons name="folder-open-outline" size={48} color={Colors.border} />
                                    <Text style={localStyles.emptyText}>Repository empty.</Text>
                                </View>
                            ) : (
                                documents.map((doc) => (
                                    <TouchableOpacity
                                        key={`${doc.source}-${doc.id}`}
                                        style={localStyles.docCard}
                                        onPress={() => previewDocument(doc)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={localStyles.docIcon}>
                                            <Ionicons name="document-text-outline" size={22} color={Colors.accent} />
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={localStyles.docTitle} numberOfLines={1}>{doc.filename}</Text>
                                            <Text style={localStyles.docSubtitle}>{doc.document_type} • {doc.source === 'employee' ? 'Official' : 'Personal'}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => downloadDocument(doc)}>
                                            <Ionicons name="cloud-download-outline" size={22} color={Colors.textSecondary} />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </ScrollView>
                );

            case 'requests':
                return (
                    <ScrollView contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={localStyles.heroBannerMini}>
                            <View>
                                <Text style={localStyles.heroTitle}>Requests</Text>
                                <Text style={localStyles.heroSubtitle}>{requests.length} Active</Text>
                            </View>
                            <TouchableOpacity style={localStyles.newRequestBtn} onPress={() => setRequestModalVisible(true)}>
                                <Ionicons name="add" size={20} color="white" />
                                <Text style={localStyles.newRequestText}>New</Text>
                            </TouchableOpacity>
                        </View>

                        {requests.length === 0 ? (
                            <View style={localStyles.emptyCenter}>
                                <Ionicons name="chatbubbles-outline" size={48} color={Colors.border} />
                                <Text style={localStyles.emptyText}>No requests found.</Text>
                            </View>
                        ) : (
                            requests.map((request) => (
                                <TouchableOpacity
                                    key={request.id}
                                    style={localStyles.requestCard}
                                    onPress={() => isManager ? openManagerRequestModal(request) : null}
                                    activeOpacity={isManager ? 0.7 : 1}
                                >
                                    <View style={localStyles.itemHead}>
                                        <View style={[localStyles.statusPill, { backgroundColor: getStatusStyle(request.status).bg }]}>
                                            <Ionicons name={getStatusIcon(request.status)} size={10} color={getStatusStyle(request.status).text} style={{ marginRight: 4 }} />
                                            <Text style={[localStyles.statusPillText, { color: getStatusStyle(request.status).text }]}>
                                                {request.status.toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={localStyles.cardDate}>{request.date}</Text>
                                    </View>

                                    <Text style={localStyles.caseSubject}>{request.subject}</Text>
                                    <Text style={localStyles.caseMessage} numberOfLines={2}>{request.message}</Text>

                                    {request.response && (
                                        <View style={localStyles.responseNote}>
                                            <Text style={localStyles.responseText}>{request.response}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                );

            case 'profile':
                return (
                    <ScrollView contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={localStyles.profileHero}>
                            <View style={localStyles.avatarLarge}>
                                <Text style={localStyles.avatarLargeText}>
                                    {profileData?.user?.name ? profileData.user.name.split(' ').map(n => n[0]).join('') : user.name[0]}
                                </Text>
                            </View>
                            <Text style={localStyles.profileName}>{profileData?.user?.name || user.name}</Text>
                            <Text style={localStyles.profileRole}>{profileData?.employee?.job_title || 'Staff'}</Text>
                        </View>

                        <View style={localStyles.sectionCard}>
                            <Text style={localStyles.sectionTitle}>Personal</Text>
                            <ProfileDetail label="Email" value={profileData?.user?.email || user.email} icon="mail-outline" />
                            <ProfileDetail label="Phone" value={profileData?.employee?.phone || 'Not set'} icon="call-outline" />
                            <ProfileDetail label="ID" value={profileData?.employee?.id_number || 'Pending'} icon="id-card-outline" />
                        </View>

                        <TouchableOpacity style={localStyles.logoutAction} onPress={onLogout}>
                            <Text style={localStyles.logoutActionText}>Sign Out</Text>
                        </TouchableOpacity>
                    </ScrollView>
                );

            default:
                return null;
        }
    };

    const TabButton = ({ id, label, icon }) => (
        <TouchableOpacity
            style={localStyles.tabButton}
            onPress={() => setActiveTab(id)}
            activeOpacity={0.7}
        >
            <Ionicons
                name={activeTab === id ? icon : `${icon}-outline`}
                size={22}
                color={activeTab === id ? Colors.accent : Colors.textSecondary}
            />
            <Text style={[localStyles.tabLabel, activeTab === id && localStyles.activeTabLabel]}>
                {label}
            </Text>
            {activeTab === id && <View style={localStyles.activeIndicator} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={localStyles.container}>
            <View style={localStyles.mainHeader}>
                <View>
                    <Text style={localStyles.headerBrand}>COPILOT</Text>
                    <Text style={localStyles.headerRole}>{user.role?.toUpperCase() || 'STAFF'} PORTAL</Text>
                </View>
                <TouchableOpacity onPress={fetchAllData} style={localStyles.headerRefresh}>
                    <Ionicons name="notifications-outline" size={22} color={Colors.text} />
                    <View style={localStyles.notifBadge} />
                </TouchableOpacity>
            </View>

            <View style={localStyles.mainContent}>
                {renderContent()}
            </View>

            <View style={localStyles.bottomBar}>
                <TabButton id="home" label="Home" icon="grid" />
                <TabButton id="colleagues" label="Team" icon="people" />

                <TouchableOpacity
                    style={localStyles.tabButton}
                    onPress={() => setActiveTab('requests')}
                    activeOpacity={0.7}
                >
                    <View>
                        <Ionicons
                            name={activeTab === 'requests' ? "chatbox" : "chatbox-outline"}
                            size={22}
                            color={activeTab === 'requests' ? Colors.accent : Colors.textSecondary}
                        />
                        {requests.filter(r => r.status === 'pending').length > 0 && (
                            <View style={localStyles.tabBadge}>
                                <Text style={localStyles.tabBadgeText}>
                                    {requests.filter(r => r.status === 'pending').length}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={[localStyles.tabLabel, activeTab === 'requests' && localStyles.activeTabLabel]}>
                        Center
                    </Text>
                    {activeTab === 'requests' && <View style={localStyles.activeIndicator} />}
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
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalContent}>
                        <View style={localStyles.modalHeader}>
                            <Text style={localStyles.modalTitle}>Request Leave</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={localStyles.modalForm} showsVerticalScrollIndicator={false}>
                            <Text style={localStyles.label}>Leave Type</Text>
                            <View style={localStyles.typeRow}>
                                {['annual', 'sick', 'emergency'].map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[localStyles.typeButton, leaveType === type && localStyles.typeButtonActive]}
                                        onPress={() => setLeaveType(type)}
                                    >
                                        <Text style={[localStyles.typeButtonText, leaveType === type && localStyles.typeButtonTextActive]}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={localStyles.label}>Start Date</Text>
                            <TouchableOpacity style={localStyles.dateInput} onPress={() => setShowStartPicker(true)}>
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

                            <Text style={localStyles.label}>End Date</Text>
                            <TouchableOpacity style={localStyles.dateInput} onPress={() => setShowEndPicker(true)}>
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

                            <Text style={localStyles.label}>Reason</Text>
                            <TextInput
                                style={localStyles.textArea}
                                multiline
                                numberOfLines={4}
                                placeholder="Enter reason for leave..."
                                value={reason}
                                onChangeText={setReason}
                            />

                            <TouchableOpacity
                                style={[localStyles.submitButton, submitting && localStyles.disabledButton]}
                                onPress={handleCreateLeave}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="white" /> : <Text style={localStyles.submitButtonText}>Submit Request</Text>}
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
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalContent}>
                        <View style={localStyles.modalHeader}>
                            <Text style={localStyles.modalTitle}>New Request</Text>
                            <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={localStyles.modalForm} showsVerticalScrollIndicator={false}>
                            <Text style={localStyles.label}>Category</Text>
                            <View style={[localStyles.infoGrid, { marginHorizontal: -4 }]}>
                                {categories.map((cat) => (
                                    <View key={cat.id} style={{ width: '50%', padding: 4 }}>
                                        <TouchableOpacity
                                            style={[localStyles.typeButton, reqCategory === cat.id && localStyles.typeButtonActive, { flexDirection: 'column', height: 80, justifyContent: 'center' }]}
                                            onPress={() => setReqCategory(cat.id)}
                                        >
                                            <Feather name={cat.icon} size={24} color={reqCategory === cat.id ? 'white' : '#6b7280'} style={{ marginBottom: 8 }} />
                                            <Text style={[localStyles.typeButtonText, reqCategory === cat.id && localStyles.typeButtonTextActive, { fontSize: 12 }]}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <Text style={localStyles.label}>Subject</Text>
                            <TextInput
                                style={localStyles.phoneInput}
                                placeholder="Brief description"
                                value={reqSubject}
                                onChangeText={setReqSubject}
                            />

                            <Text style={localStyles.label}>Message</Text>
                            <TextInput
                                style={localStyles.textArea}
                                multiline
                                numberOfLines={4}
                                placeholder="Detailed explanation..."
                                value={reqMessage}
                                onChangeText={setReqMessage}
                            />

                            <TouchableOpacity
                                style={[localStyles.submitButton, reqSubmitting && localStyles.disabledButton]}
                                onPress={handleCreateRequest}
                                disabled={reqSubmitting}
                            >
                                {reqSubmitting ? <ActivityIndicator color="white" /> : <Text style={localStyles.submitButtonText}>Submit Request</Text>}
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
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalContent}>
                        <View style={localStyles.modalHeader}>
                            <Text style={localStyles.modalTitle}>Update Request</Text>
                            <TouchableOpacity onPress={() => setManagerResponseModalVisible(false)}>
                                <Feather name="x" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={localStyles.modalForm} showsVerticalScrollIndicator={false}>
                            {selectedRequest && (
                                <View style={localStyles.requestDetailBlock}>
                                    <Text style={localStyles.requestDetailTitle}>Subject</Text>
                                    <Text style={localStyles.requestDetailText}>{selectedRequest.subject}</Text>

                                    <Text style={[localStyles.requestDetailTitle, { marginTop: 12 }]}>Employee</Text>
                                    <Text style={localStyles.requestDetailText}>{selectedRequest.user?.name || 'Unknown'}</Text>

                                    <Text style={[localStyles.requestDetailTitle, { marginTop: 12 }]}>Message</Text>
                                    <View style={localStyles.messageBox}>
                                        <Text style={localStyles.messageText}>{selectedRequest.message}</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={localStyles.label}>Status</Text>
                            <View style={localStyles.typeRow}>
                                {['pending', 'in-progress', 'resolved'].map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[localStyles.typeButton, statusUpdate === st && localStyles.typeButtonActive]}
                                        onPress={() => setStatusUpdate(st)}
                                    >
                                        <Text style={[localStyles.typeButtonText, statusUpdate === st && localStyles.typeButtonTextActive, { fontSize: 12 }]}>
                                            {st === 'in-progress' ? 'In Progress' : st.charAt(0).toUpperCase() + st.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={localStyles.label}>Response Message</Text>
                            <TextInput
                                style={localStyles.textArea}
                                multiline
                                numberOfLines={4}
                                placeholder="Write a response to the employee..."
                                value={responseMessage}
                                onChangeText={setResponseMessage}
                            />

                            <TouchableOpacity
                                style={[localStyles.submitButton, updatingRequest && localStyles.disabledButton]}
                                onPress={handleUpdateRequest}
                                disabled={updatingRequest}
                            >
                                {updatingRequest ? <ActivityIndicator color="white" /> : <Text style={localStyles.submitButtonText}>Update Request</Text>}
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
                <View style={localStyles.centerModalOverlay}>
                    <View style={localStyles.loadingPopup}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={localStyles.loadingText}>{loadingText}</Text>
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
                <View style={localStyles.viewerContainer}>
                    <View style={[localStyles.viewerHeader, { paddingTop: Math.max(insets.top, 10) }]}>
                        <TouchableOpacity
                            onPress={() => setViewerVisible(false)}
                            style={localStyles.closeBtn}
                            hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
                        >
                            <Feather name="x" size={24} color="#374151" />
                        </TouchableOpacity>
                        <Text style={localStyles.viewerTitle} numberOfLines={1}>Document Preview</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={localStyles.webviewWrapper}>
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

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    mainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerBrand: {
        ...Typography.h3,
        letterSpacing: 1.5,
        color: Colors.text,
    },
    headerRole: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.accent,
        marginTop: 2,
    },
    headerRefresh: {
        width: 44,
        height: 44,
        borderRadius: Radius.full,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    notifBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
        borderWidth: 1.5,
        borderColor: Colors.surface,
    },
    mainContent: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
    heroBanner: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        ...Shadow.medium,
    },
    heroBannerMini: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    heroPreTitle: {
        textTransform: 'uppercase',
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1,
    },
    heroTitle: {
        ...Typography.h2,
        color: 'white',
        marginTop: 4,
    },
    heroSubtitle: {
        ...Typography.body,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: Radius.lg,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    actionRow: {
        marginBottom: Spacing.lg,
    },
    quickActionBtn: {
        backgroundColor: Colors.accent,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.medium,
    },
    quickActionText: {
        color: 'white',
        fontWeight: '700',
        marginLeft: 8,
    },
    sectionCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.h3,
        fontSize: 16,
    },
    refreshBtn: {
        padding: 4,
    },
    dataItem: {
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.background,
    },
    itemHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemType: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text,
    },
    itemRange: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Radius.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusPillText: {
        fontSize: 10,
        fontWeight: '800',
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        paddingVertical: Spacing.xl,
        fontSize: 14,
    },
    // COLLEAGUES
    sectionContainer: {
        marginBottom: Spacing.xl,
    },
    colleagueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: Radius.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    avatarBox: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    colleagueName: {
        ...Typography.body,
        fontWeight: '600',
    },
    colleagueRole: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    // DOCUMENTS
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    docIcon: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        backgroundColor: `${Colors.accent}10`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docTitle: {
        ...Typography.body,
        fontWeight: '600',
    },
    docSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    emptyCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    // REQUESTS
    newRequestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Radius.md,
    },
    newRequestText: {
        color: 'white',
        fontWeight: '700',
        marginLeft: 4,
        fontSize: 13,
    },
    requestCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    caseSubject: {
        ...Typography.h3,
        fontSize: 15,
        marginTop: Spacing.sm,
    },
    caseMessage: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    cardDate: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    responseNote: {
        backgroundColor: Colors.background,
        padding: Spacing.md,
        borderRadius: Radius.md,
        marginTop: Spacing.md,
    },
    responseText: {
        fontSize: 13,
        color: Colors.accent,
        fontStyle: 'italic',
    },
    // PROFILE
    profileHero: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadow.medium,
    },
    avatarLargeText: {
        color: 'white',
        fontSize: 28,
        fontWeight: '700',
    },
    profileName: {
        ...Typography.h2,
    },
    profileRole: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    profileDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.background,
    },
    profileDetailIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    profileDetailLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    profileDetailValue: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '600',
    },
    logoutAction: {
        backgroundColor: Colors.error,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        marginTop: Spacing.lg,
        ...Shadow.medium,
    },
    logoutActionText: {
        color: 'white',
        fontWeight: '700',
        marginLeft: 8,
    },
    // TAB BAR
    bottomBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        height: 85,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingBottom: 20,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginTop: 4,
    },
    activeTabLabel: {
        color: Colors.accent,
    },
    activeIndicator: {
        position: 'absolute',
        top: 0,
        width: 24,
        height: 3,
        backgroundColor: Colors.accent,
        borderBottomLeftRadius: Radius.sm,
        borderBottomRightRadius: Radius.sm,
    },
    tabBadge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: Colors.error,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        padding: Spacing.xl,
        maxHeight: '80%',
        ...Shadow.medium,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        ...Typography.h2,
        color: Colors.text,
    },
    modalForm: {
        marginBottom: Spacing.xl,
    },
    label: {
        ...Typography.caption,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    typeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    typeButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    typeButtonActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
        ...Shadow.subtle,
    },
    typeButtonText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    typeButtonTextActive: {
        color: 'white',
        fontWeight: '700',
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radius.lg,
        backgroundColor: Colors.background,
    },
    textArea: {
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        backgroundColor: Colors.background,
        height: 100,
        textAlignVertical: 'top',
        ...Typography.body,
    },
    submitButton: {
        backgroundColor: Colors.accent,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        alignItems: 'center',
        marginTop: Spacing.xl,
        ...Shadow.medium,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: Colors.border,
        opacity: 0.6,
    },
    centerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingPopup: {
        backgroundColor: Colors.surface,
        padding: Spacing.xl,
        borderRadius: Radius.lg,
        alignItems: 'center',
        ...Shadow.medium,
    },
    loadingText: {
        marginTop: Spacing.md,
        ...Typography.body,
        color: Colors.text,
        fontWeight: '600',
    },
    viewerContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    viewerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    viewerTitle: {
        ...Typography.h3,
        fontSize: 16,
        color: Colors.text,
        flex: 1,
        textAlign: 'center',
    },
    closeBtn: {
        padding: Spacing.sm,
        borderRadius: Radius.full,
        backgroundColor: Colors.background,
    },
    webviewWrapper: {
        flex: 1,
        marginHorizontal: Spacing.md,
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    phoneInput: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.md,
        height: 48,
        ...Typography.body,
    },
    // REQUEST DETAIL STYLES
    requestDetailBlock: {
        backgroundColor: Colors.background,
        padding: Spacing.lg,
        borderRadius: Radius.lg,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    requestDetailTitle: {
        ...Typography.caption,
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    requestDetailText: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.text,
    },
    messageBox: {
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: Radius.md,
        marginTop: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    messageText: {
        ...Typography.body,
        fontStyle: 'italic',
        color: Colors.textSecondary,
    },
});
