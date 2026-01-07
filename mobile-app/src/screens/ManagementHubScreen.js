import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';
import styles from '../styles/styles';

/**
 * Management Hub - The control center for Admins and Managers
 */
export default function ManagementHubScreen({ navigation, user }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            // We'll fetch stats from the existing dashboard stats or a new management endpoint
            // For now, let's use the dashboard stats and supplement with others if needed
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
            title: 'Users',
            subtitle: 'Access management',
            icon: 'person-circle',
            color: Colors.accent,
            bgColor: Colors.border,
            count: stats?.total_users || 0,
            screen: 'UserList',
        },
        {
            id: 'employees',
            title: 'Employees',
            subtitle: 'HR directory',
            icon: 'people',
            color: Colors.accent,
            bgColor: Colors.border,
            count: stats?.total_employees || 0,
            screen: 'People', // Will pass a 'manage' mode param
            params: { mode: 'employees', manage: true }
        },
        {
            id: 'candidates',
            title: 'Candidates',
            subtitle: 'Recruitment pipeline',
            icon: 'person-add',
            color: Colors.accent,
            bgColor: Colors.border,
            count: stats?.total_candidates || 0,
            screen: 'CandidateList',
        },
        {
            id: 'depts',
            title: 'Departments',
            subtitle: 'Organization structure',
            icon: 'business',
            color: Colors.accent,
            bgColor: Colors.border,
            count: stats?.total_departments || 0,
            screen: 'Depts',
        }
    ];

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaView style={localStyles.container} edges={['top']}>
            <View style={localStyles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={localStyles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View>
                    <Text style={localStyles.headerTitle}>Management</Text>
                    <Text style={localStyles.headerSubtitle}>Control Center</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={localStyles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                }
            >
                <View style={localStyles.grid}>
                    {managementOptions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={localStyles.card}
                            onPress={() => navigation.navigate(item.screen, item.params || {})}
                            activeOpacity={0.7}
                        >
                            <View style={[localStyles.iconContainer, { backgroundColor: item.bgColor }]}>
                                <Ionicons name={item.icon} size={30} color={item.color} />
                            </View>
                            <View style={localStyles.cardContent}>
                                <View style={localStyles.cardHeader}>
                                    <Text style={localStyles.cardTitle}>{item.title}</Text>
                                    <View style={localStyles.countBadge}>
                                        <Text style={localStyles.countText}>{item.count}</Text>
                                    </View>
                                </View>
                                <Text style={localStyles.cardSubtitle}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Stats Section */}
                <View style={localStyles.sectionHeader}>
                    <Text style={localStyles.sectionTitle}>Overview</Text>
                </View>

                <View style={localStyles.statsRow}>
                    <View style={localStyles.statBox}>
                        <Text style={localStyles.statLabel}>Active Users</Text>
                        <Text style={[localStyles.statValue, { color: '#10b981' }]}>
                            {stats?.total_users || 0}
                        </Text>
                    </View>
                    <View style={localStyles.statBox}>
                        <Text style={localStyles.statLabel}>Pending Requests</Text>
                        <Text style={[localStyles.statValue, { color: '#f59e0b' }]}>
                            {stats?.pending_requests || 0}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    scrollContent: {
        padding: 16,
    },
    grid: {
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    countBadge: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4b5563',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    sectionHeader: {
        marginTop: 24,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    statLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
    }
});
