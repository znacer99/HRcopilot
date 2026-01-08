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
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';

/**
 * Requests Screen - HR 2026 Professional Design
 */
export default function RequestsScreen({ user }) {
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Manager Response Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    const fetchRequests = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRequests();
    }, [fetchRequests]);

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
            case 'pending': return { color: colors.warning, bg: `${colors.warning}15`, icon: 'time-outline' };
            case 'in-progress': return { color: colors.accent, bg: `${colors.accent}15`, icon: 'refresh-circle-outline' };
            case 'resolved': return { color: colors.success, bg: `${colors.success}15`, icon: 'checkmark-circle-outline' };
            default: return { color: colors.textSecondary, bg: colors.background, icon: 'help-circle-outline' };
        }
    };

    const styles = getStyles(colors);

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <SafeAreaView style={styles.header} edges={['top']}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.screenTitle}>Protocols</Text>
                        <Text style={styles.screenSubtitle}>ALGHAITH Group Requests</Text>
                    </View>
                    <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                        placeholder="Search request logs..."
                        placeholderTextColor={colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.summaryRow}>
                    <SummaryBox
                        colors={colors}
                        label="Resolved"
                        count={requests.filter(r => r.status === 'resolved').length}
                        color={colors.success}
                        icon="checkmark-done"
                    />
                    <SummaryBox
                        colors={colors}
                        label="Pending"
                        count={requests.filter(r => r.status !== 'resolved').length}
                        color={colors.accent}
                        icon="pulse"
                    />
                </View>
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
            >
                {requests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="documents-outline" size={40} color={colors.border} />
                        </View>
                        <Text style={styles.emptyTitle}>No requests</Text>
                        <Text style={styles.emptyText}>Queue is clear.</Text>
                    </View>
                ) : (
                    requests
                        .filter(req => {
                            if (!search) return true;
                            const s = search.toLowerCase();
                            return (
                                req.subject?.toLowerCase().includes(s) ||
                                req.message?.toLowerCase().includes(s) ||
                                req.user?.name?.toLowerCase().includes(s) ||
                                req.user?.full_name?.toLowerCase().includes(s)
                            );
                        })
                        .map((request) => {
                            const theme = getStatusTheme(request.status);
                            return (
                                <TouchableOpacity
                                    key={request.id}
                                    style={styles.requestCard}
                                    onPress={() => openResponseModal(request)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardHeader}>
                                        <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
                                            <Ionicons name={theme.icon} size={12} color={theme.color} />
                                            <Text style={[styles.statusText, { color: theme.color }]}>
                                                {request.status?.toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={styles.cardDate}>{request.date || 'Today'}</Text>
                                    </View>

                                    <View style={styles.userMeta}>
                                        <View style={[styles.dot, { backgroundColor: theme.color }]} />
                                        <Text style={styles.userName}>{request.user?.full_name || request.user?.name || 'User'}</Text>
                                        <Text style={styles.category}> • {request.category}</Text>
                                    </View>

                                    <Text style={styles.subject}>{request.subject}</Text>
                                    <Text style={styles.message} numberOfLines={2}>{request.message}</Text>

                                    <View style={styles.cardFooter}>
                                        <Text style={styles.actionLink}>View details</Text>
                                        <Ionicons name="chevron-forward" size={14} color={colors.accent} />
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
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalPreTitle}>Protocol</Text>
                                <Text style={styles.modalTitle}>Resolution</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            {selectedRequest && (
                                <View style={styles.caseOverview}>
                                    <CaseInfo colors={colors} label="Subject" value={selectedRequest.subject} />
                                    <CaseInfo colors={colors} label="Category" value={selectedRequest.category} />
                                    <View style={styles.narrativeBox}>
                                        <Text style={styles.narrativeLabel}>Message</Text>
                                        <Text style={styles.narrativeText}>{selectedRequest.message}</Text>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.inputLabel}>Protocol</Text>
                            <View style={styles.statusSelector}>
                                {['pending', 'in-progress', 'resolved'].map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[
                                            styles.statusBtn,
                                            statusUpdate === st && styles.statusBtnActive
                                        ]}
                                        onPress={() => setStatusUpdate(st)}
                                    >
                                        <Text style={[
                                            styles.statusBtnText,
                                            statusUpdate === st && styles.statusBtnTextActive
                                        ]}>
                                            {st === 'in-progress' ? 'WIP' : st.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Response</Text>
                            <TextInput
                                style={styles.modalInput}
                                multiline
                                numberOfLines={4}
                                placeholder="Enter response content..."
                                placeholderTextColor={colors.textSecondary}
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

const SummaryBox = ({ colors, label, count, color, icon }) => {
    const styles = getStyles(colors);
    return (
        <View style={styles.summaryBox}>
            <View style={[styles.summaryIcon, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={14} color={color} />
            </View>
            <View>
                <Text style={styles.summaryCount}>{count}</Text>
                <Text style={styles.summaryLabel}>{label}</Text>
            </View>
        </View>
    );
};

const CaseInfo = ({ colors, label, value }) => {
    const styles = getStyles(colors);
    return (
        <View style={styles.caseInfoRow}>
            <Text style={styles.caseInfoLabel}>{label}</Text>
            <Text style={styles.caseInfoValue}>{value}</Text>
        </View>
    );
};

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: Radius.lg,
        paddingHorizontal: 12,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: colors.text,
    },
    screenTitle: {
        ...Typography.h1,
        color: colors.text,
    },
    screenSubtitle: {
        ...Typography.subtitle,
        color: colors.textSecondary,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    themeToggle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statBadge: {
        backgroundColor: colors.primary,
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
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
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
        color: colors.text,
    },
    summaryLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    scrollList: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    requestCard: {
        backgroundColor: colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
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
        color: colors.textSecondary,
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
        marginRight: 8,
    },
    userName: {
        ...Typography.body,
        fontWeight: '700',
        fontSize: 14,
        color: colors.text,
    },
    category: {
        ...Typography.caption,
        color: colors.textSecondary,
        textTransform: 'none',
    },
    subject: {
        ...Typography.h2,
        fontSize: 16,
        marginBottom: 6,
        color: colors.text,
    },
    message: {
        ...Typography.body,
        color: colors.textSecondary,
        fontSize: 13,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionLink: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.accent,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: Radius.full,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        ...Typography.h2,
        fontSize: 18,
        color: colors.text,
    },
    emptyText: {
        ...Typography.body,
        color: colors.textSecondary,
        marginTop: 4,
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
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
    modalPreTitle: {
        ...Typography.caption,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    modalTitle: {
        ...Typography.h2,
        color: colors.text,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    caseOverview: {
        backgroundColor: colors.background,
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
        color: colors.textSecondary,
    },
    caseInfoValue: {
        ...Typography.body,
        fontWeight: '600',
        fontSize: 14,
        color: colors.text,
    },
    narrativeBox: {
        marginTop: 8,
    },
    narrativeLabel: {
        ...Typography.caption,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    narrativeText: {
        ...Typography.body,
        fontSize: 14,
        color: colors.text,
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputLabel: {
        ...Typography.body,
        fontWeight: '700',
        color: colors.text,
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
        backgroundColor: colors.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statusBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    statusBtnText: {
        ...Typography.caption,
        fontWeight: '800',
        color: colors.textSecondary,
    },
    statusBtnTextActive: {
        color: 'white',
    },
    modalInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: Radius.md,
        padding: 16,
        fontSize: 16,
        color: colors.text,
        height: 120,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    modalContent: {
        // padding: 20
    }
});
