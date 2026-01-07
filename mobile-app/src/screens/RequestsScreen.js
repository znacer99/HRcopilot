import React, { useState, useEffect, useCallback } from 'react';
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
    RefreshControl,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';
import { Colors, Spacing, Radius, Shadow, Typography } from '../styles/theme';
import styles from '../styles/styles';
import Button from '../components/Button';

export default function RequestsScreen({ user }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Manager Response Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await apiService.fetchAllRequests();
            if (res.success) {
                setRequests(res.requests || []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRequests();
    }, []);

    const openResponseModal = (req) => {
        setSelectedRequest(req);
        setStatusUpdate(req.status);
        setResponseMessage(req.response || '');
        setModalVisible(true);
    };

    const handleSubmitResponse = async () => {
        if (!selectedRequest) return;

        setSubmitting(true);
        try {
            const res = await apiService.updateRequest(selectedRequest.id, {
                status: statusUpdate,
                response: responseMessage
            });

            if (res.success) {
                Alert.alert('Success', 'Resolution protocol updated.');
                setModalVisible(false);
                setSelectedRequest(null);
                setResponseMessage('');
                fetchRequests();
            } else {
                Alert.alert('System Alert', res.message || 'Failed to update record.');
            }
        } catch (error) {
            console.error('Update Request Error:', error);
            Alert.alert('System Error', 'Failed to synchronize update.');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusTheme = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return { color: Colors.warning, bg: `${Colors.warning}10`, icon: 'time-outline' };
            case 'in-progress': return { color: Colors.accent, bg: `${Colors.accent}10`, icon: 'refresh-circle-outline' };
            case 'resolved': return { color: Colors.success, bg: `${Colors.success}10`, icon: 'checkmark-circle-outline' };
            default: return { color: Colors.textSecondary, bg: Colors.background, icon: 'help-circle-outline' };
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={localStyles.header} edges={['top']}>
                <View style={localStyles.topBar}>
                    <View>
                        <Text style={styles.screenTitle}>Requests</Text>
                        <Text style={styles.screenSubtitle}>Service Management</Text>
                    </View>
                    <View style={localStyles.statBadge}>
                        <Text style={localStyles.statBadgeText}>{pendingCount}</Text>
                    </View>
                </View>

                <View style={localStyles.summaryRow}>
                    <SummaryBox
                        label="Resolved"
                        count={requests.filter(r => r.status === 'resolved').length}
                        color={Colors.success}
                        icon="checkmark-done"
                    />
                    <SummaryBox
                        label="Pending"
                        count={requests.filter(r => r.status !== 'resolved').length}
                        color={Colors.accent}
                        icon="pulse"
                    />
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={localStyles.scrollList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
            >
                {requests.length === 0 ? (
                    <View style={localStyles.emptyState}>
                        <View style={localStyles.emptyIcon}>
                            <Ionicons name="documents-outline" size={40} color={Colors.border} />
                        </View>
                        <Text style={localStyles.emptyTitle}>No requests</Text>
                        <Text style={localStyles.emptyText}>Queue is clear.</Text>
                    </View>
                ) : (
                    requests.map((request) => {
                        const theme = getStatusTheme(request.status);
                        return (
                            <TouchableOpacity
                                key={request.id}
                                style={localStyles.requestCard}
                                onPress={() => openResponseModal(request)}
                                activeOpacity={0.8}
                            >
                                <View style={localStyles.cardHeader}>
                                    <View style={[localStyles.statusPill, { backgroundColor: theme.bg }]}>
                                        <Ionicons name={theme.icon} size={12} color={theme.color} />
                                        <Text style={[localStyles.statusText, { color: theme.color }]}>
                                            {request.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={localStyles.cardDate}>{request.date || 'Today'}</Text>
                                </View>

                                <View style={localStyles.userMeta}>
                                    <View style={localStyles.dot} />
                                    <Text style={localStyles.userName}>{request.user?.full_name || request.user?.name || 'User'}</Text>
                                    <Text style={localStyles.category}> • {request.category}</Text>
                                </View>

                                <Text style={localStyles.subject}>{request.subject}</Text>
                                <Text style={localStyles.message} numberOfLines={2}>{request.message}</Text>

                                <View style={localStyles.cardFooter}>
                                    <Text style={localStyles.actionLink}>View details</Text>
                                    <Ionicons name="chevron-forward" size={14} color={Colors.accent} />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* RESPONSE MODAL */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={localStyles.modalOverlay}>
                    <View style={localStyles.modalSheet}>
                        <View style={localStyles.modalHeader}>
                            <View>
                                <Text style={localStyles.modalPreTitle}>Protocol</Text>
                                <Text style={localStyles.modalTitle}>Resolution</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={localStyles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={localStyles.modalContent} showsVerticalScrollIndicator={false}>
                            {selectedRequest && (
                                <View style={localStyles.caseOverview}>
                                    <CaseInfo label="Subject" value={selectedRequest.subject} />
                                    <CaseInfo label="Category" value={selectedRequest.category} />
                                    <View style={localStyles.narrativeBox}>
                                        <Text style={localStyles.narrativeLabel}>Message</Text>
                                        <Text style={localStyles.narrativeText}>{selectedRequest.message}</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={localStyles.inputLabel}>Protocol</Text>
                            <View style={localStyles.statusSelector}>
                                {['pending', 'in-progress', 'resolved'].map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[
                                            localStyles.statusBtn,
                                            statusUpdate === st && localStyles.statusBtnActive
                                        ]}
                                        onPress={() => setStatusUpdate(st)}
                                    >
                                        <Text style={[
                                            localStyles.statusBtnText,
                                            statusUpdate === st && localStyles.statusBtnTextActive
                                        ]}>
                                            {st === 'in-progress' ? 'WIP' : st.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={localStyles.inputLabel}>Response</Text>
                            <TextInput
                                style={localStyles.modalInput}
                                multiline
                                numberOfLines={4}
                                placeholder="Enter response content..."
                                value={responseMessage}
                                onChangeText={setResponseMessage}
                            />

                            <Button
                                title="Update"
                                loading={submitting}
                                onPress={handleSubmitResponse}
                            />
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const SummaryBox = ({ label, count, color, icon }) => (
    <View style={localStyles.summaryBox}>
        <View style={[localStyles.summaryIcon, { backgroundColor: `${color}10` }]}>
            <Ionicons name={icon} size={14} color={color} />
        </View>
        <View>
            <Text style={localStyles.summaryCount}>{count}</Text>
            <Text style={localStyles.summaryLabel}>{label}</Text>
        </View>
    </View>
);

const CaseInfo = ({ label, value }) => (
    <View style={localStyles.caseInfoRow}>
        <Text style={localStyles.caseInfoLabel}>{label}</Text>
        <Text style={localStyles.caseInfoValue}>{value}</Text>
    </View>
);

const localStyles = StyleSheet.create({
    header: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    statBadge: {
        backgroundColor: Colors.primary,
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statBadgeText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
    },
    summaryRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        gap: 12,
        paddingBottom: Spacing.md,
    },
    summaryBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 12,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    summaryCount: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.primary,
    },
    summaryLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    scrollList: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    requestCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.md,
        gap: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    cardDate: {
        ...Typography.caption,
        fontSize: 11,
    },
    userMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.accent,
        marginRight: 8,
    },
    userName: {
        ...Typography.body,
        fontWeight: '700',
        fontSize: 14,
    },
    category: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
    subject: {
        ...Typography.h2,
        fontSize: 16,
        marginBottom: 6,
    },
    message: {
        ...Typography.body,
        color: Colors.textSecondary,
        fontSize: 13,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    actionLink: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.accent,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: Radius.full,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        ...Typography.h2,
        fontSize: 18,
    },
    emptyText: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: Colors.surface,
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
    modalPreTitle: {
        ...Typography.caption,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    modalTitle: {
        ...Typography.h2,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    caseOverview: {
        backgroundColor: Colors.background,
        borderRadius: Radius.lg,
        padding: 16,
        gap: 12,
        marginBottom: 24,
    },
    caseInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    caseInfoLabel: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
    caseInfoValue: {
        ...Typography.body,
        fontWeight: '600',
        fontSize: 14,
    },
    narrativeBox: {
        marginTop: 8,
    },
    narrativeLabel: {
        ...Typography.caption,
        marginBottom: 4,
    },
    narrativeText: {
        ...Typography.body,
        fontSize: 14,
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputLabel: {
        ...Typography.body,
        fontWeight: '700',
        marginBottom: 12,
    },
    statusSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    statusBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: Radius.md,
        backgroundColor: Colors.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statusBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    statusBtnText: {
        ...Typography.caption,
        fontWeight: '800',
    },
    statusBtnTextActive: {
        color: 'white',
    },
    modalInput: {
        ...styles.input,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
});
