import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';

const { width } = Dimensions.get('window');

/**
 * Management Hub - HR 2026 Executive Design
 */
export default function ManagementHubScreen({ navigation, user }) {
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const response = await apiService.getDashboardStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error("Failed to fetch management stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const managementOptions = [
        {
            id: 'users',
            title: 'User Registry',
            subtitle: 'Access level governance',
            icon: 'shield-half',
            screen: 'UserList',
        },
        {
            id: 'employees',
            title: 'Personnel Directory',
            subtitle: 'HR enterprise assets',
            icon: 'people',
            screen: 'Staff',
            params: { mode: 'employees', manage: true }
        },
        {
            id: 'candidates',
            title: 'Recruitment Flow',
            subtitle: 'Talent acquisition pipeline',
            icon: 'rocket',
            screen: 'CandidateList',
        },
        {
            id: 'depts',
            title: 'Org Structure',
            subtitle: 'Departmental hierarchy',
            icon: 'business',
            screen: 'Depts',
        }
    ];

    const styles = getStyles(colors);

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>ALGHAITH Admin</Text>
                    <Text style={styles.headerSubtitle}>Governance Command Center</Text>
                </View>
                <TouchableOpacity onPress={toggleTheme} style={styles.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons
                        name={isDarkMode ? "sunny" : "moon"}
                        size={22}
                        color={colors.accent}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
            >
                {/* System Health Indicators */}
                <View style={styles.healthRow}>
                    <HealthIndicator label="API" status="Active" color="#10b981" colors={colors} />
                    <HealthIndicator label="DB" status="Linked" color="#10b981" colors={colors} />
                    <HealthIndicator label="Cloud" status="Syncing" color="#3b82f6" colors={colors} />
                </View>

                {/* Dashboard Stats */}
                <View style={styles.statsSummary}>
                    <SummaryCard
                        label="Total Assets"
                        value={stats?.total_employees || 0}
                        icon="people"
                        colors={colors}
                    />
                    <SummaryCard
                        label="Pending Action"
                        value={stats?.pending_requests || 0}
                        icon="alert-circle"
                        color={colors.error}
                        colors={colors}
                    />
                </View>

                {/* Management Modules */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Governance Modules</Text>
                </View>

                <View style={styles.grid}>
                    {managementOptions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.card}
                            onPress={() => navigation.navigate(item.screen, item.params || {})}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconBox, { backgroundColor: `${colors.accent}10` }]}>
                                <Ionicons name={item.icon} size={28} color={colors.accent} />
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.border} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Strategic Actions</Text>
                </View>

                <View style={styles.actionRow}>
                    <QuickAction
                        colors={colors}
                        icon="person-add-outline"
                        label="Onboard User"
                        onPress={() => navigation.navigate('UserEdit')}
                    />
                    <QuickAction
                        colors={colors}
                        icon="megaphone-outline"
                        label="Broadcast"
                        onPress={() => Alert.alert("Enterprise Broadcast", "Establishing secure communication broadcast for ALGHAITH Group...")}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>ALGHAITH INTERNATIONAL GROUP • {new Date().getFullYear()}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const HealthIndicator = ({ label, status, color, colors }) => {
    const styles = getStyles(colors);
    return (
        <View style={styles.healthItem}>
            <View style={[styles.healthDot, { backgroundColor: color }]} />
            <Text style={styles.healthLabel}>{label}:</Text>
            <Text style={[styles.healthStatus, { color }]}>{status}</Text>
        </View>
    );
};

const SummaryCard = ({ label, value, icon, color, colors }) => {
    const styles = getStyles(colors);
    return (
        <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
                <Ionicons name={icon} size={18} color={color || colors.textSecondary} />
                <Text style={styles.summaryLabel}>{label}</Text>
            </View>
            <Text style={[styles.summaryValue, color && { color }]}>{value}</Text>
        </View>
    );
};

const QuickAction = ({ colors, icon, label, onPress }) => {
    const styles = getStyles(colors);
    return (
        <TouchableOpacity style={styles.quickAction} onPress={onPress}>
            <View style={styles.actionIcon}>
                <Ionicons name={icon} size={24} color={colors.accent} />
            </View>
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
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
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    healthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: Spacing.lg,
    },
    healthItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    healthDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    healthLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.textSecondary,
    },
    healthStatus: {
        fontSize: 10,
        fontWeight: '900',
    },
    statsSummary: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Spacing.lg,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: Radius.xl,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.text,
    },
    sectionHeader: {
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    grid: {
        gap: 12,
        marginBottom: Spacing.xl,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: Radius.xl,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
    },
    cardSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
    },
    quickAction: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    footerText: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.border,
        letterSpacing: 2,
    },
});
