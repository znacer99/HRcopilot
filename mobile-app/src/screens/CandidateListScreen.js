import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    TextInput,
    StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';

/**
 * Candidate List Screen - Premium Recruitment management (HR 2026 Redesign)
 */
export default function CandidateListScreen({ navigation, user }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');

    const statuses = ['All', 'New', 'Interview', 'Offer', 'Hired', 'Rejected'];

    const fetchCandidates = useCallback(async () => {
        try {
            const response = await apiService.getCandidates();
            if (response.success) {
                setCandidates(response.candidates || []);
            }
        } catch (error) {
            console.error("Failed to fetch candidates:", error);
            Alert.alert("System Sync Error", "Could not synchronize recruitment pipeline.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCandidates();
    }, [fetchCandidates]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchCandidates);
        return unsubscribe;
    }, [navigation, fetchCandidates]);

    const isPrivileged = ['it_manager', 'general_director', 'manager'].includes(user?.role?.toLowerCase());

    const onRefresh = () => {
        setRefreshing(true);
        fetchCandidates();
    };

    const filteredCandidates = candidates.filter((c) => {
        const q = search.toLowerCase();
        const matchesSearch = (
            (c.full_name || '').toLowerCase().includes(q) ||
            (c.applied_position || '').toLowerCase().includes(q)
        );
        const matchesStatus = selectedStatus === 'All' || (c.status || 'New').toLowerCase() === selectedStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    const getStatusTheme = (status) => {
        switch (status?.toLowerCase()) {
            case 'hired': return { color: colors.success, bg: `${colors.success}15` };
            case 'interview': return { color: colors.accent, bg: `${colors.accent}15` };
            case 'offer': return { color: colors.warning, bg: `${colors.warning}15` };
            case 'rejected': return { color: colors.error, bg: `${colors.error}15` };
            default: return { color: colors.textSecondary, bg: colors.border };
        }
    };

    const renderCandidate = ({ item }) => {
        const initials = item.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const st = getStatusTheme(item.status);

        return (
            <TouchableOpacity
                style={styles.candidateCard}
                onPress={() => navigation.navigate('CandidateDetail', { candidate: item, manage: isPrivileged })}
                activeOpacity={0.7}
            >
                <View style={[styles.avatarBox, { backgroundColor: st.bg }]}>
                    <Text style={[styles.avatarText, { color: st.color }]}>{initials}</Text>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.candidateName} numberOfLines={1}>{item.full_name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                            <Text style={[styles.statusText, { color: st.color }]}>{item.status?.toUpperCase() || 'NEW'}</Text>
                        </View>
                    </View>

                    <Text style={styles.candidatePost}>{item.applied_position || 'General Position'}</Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{item.applied_date || 'Recently'}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.metaItem}>
                            <Ionicons name="briefcase-outline" size={12} color={colors.textSecondary} />
                            <Text style={styles.metaText}>{item.experience_years || '0'}+ Yrs</Text>
                        </View>
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </TouchableOpacity>
        );
    };

    const styles = getStyles(colors);

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.screenTitle}>Acquisitions</Text>
                        <Text style={styles.screenSubtitle}>ALGHAITH Talent Pipeline</Text>
                    </View>
                    <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search ALGHAITH candidates..."
                        placeholderTextColor={colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <FlatList
                    horizontal
                    data={statuses}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.statusFilter,
                                selectedStatus === item && styles.statusFilterActive,
                                { borderColor: selectedStatus === item ? colors.accent : colors.border }
                            ]}
                            onPress={() => setSelectedStatus(item)}
                        >
                            <Text style={[
                                styles.statusFilterText,
                                selectedStatus === item && { color: colors.accent, fontWeight: '700' }
                            ]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterList}
                />
            </View>

            <FlatList
                data={filteredCandidates}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderCandidate}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={colors.border} />
                        <Text style={styles.emptyTitle}>No candidates found</Text>
                        <Text style={styles.emptySubtitle}>Try adjusting your search or filters.</Text>
                    </View>
                }
            />

            {isPrivileged && (
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => navigation.navigate('CandidateEdit')}
                    >
                        <Ionicons name="person-add-outline" size={20} color="white" />
                        <Text style={styles.addBtnText}>Register New Talent</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

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
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: Spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    themeToggle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: {
        ...Typography.h1,
        fontSize: 20,
        color: colors.text,
        textAlign: 'center',
    },
    screenSubtitle: {
        ...Typography.subtitle,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: -2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        marginHorizontal: Spacing.lg,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 46,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: Spacing.md,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
    },
    filterList: {
        paddingHorizontal: Spacing.lg,
    },
    statusFilter: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        marginRight: 8,
        backgroundColor: colors.surface,
    },
    statusFilterActive: {
        backgroundColor: `${colors.accent}10`,
    },
    statusFilterText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    listContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    candidateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: Radius.xl,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    avatarBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    candidateName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
    },
    candidatePost: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    separator: {
        width: 1,
        height: 12,
        backgroundColor: colors.border,
        marginHorizontal: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        ...Typography.h2,
        color: colors.text,
        marginTop: 16,
    },
    emptySubtitle: {
        ...Typography.body,
        color: colors.textSecondary,
        marginTop: 4,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: Spacing.lg,
        ...Shadow.medium,
    },
    addBtn: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 54,
        borderRadius: Radius.xl,
        gap: 12,
        ...Shadow.subtle,
    },
    addBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
});
