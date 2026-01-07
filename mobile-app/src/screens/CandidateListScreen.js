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
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';

const { width } = Dimensions.get('window');

/**
 * Candidate List Screen - Premium Recruitment management
 */
export default function CandidateListScreen({ navigation }) {
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

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'hired': return '#10b981';
            case 'interview': return '#3b82f6';
            case 'offer': return '#f59e0b';
            case 'rejected': return '#f87171';
            default: return '#64748b';
        }
    };

    const renderCandidate = ({ item }) => {
        const initials = item.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const statusColor = getStatusColor(item.status);

        return (
            <TouchableOpacity
                style={styles.candidateCard}
                onPress={() => navigation.navigate('CandidateDetail', { candidate: item, manage: true })}
                activeOpacity={0.7}
            >
                <View style={[styles.avatarBox, { backgroundColor: `${statusColor}15` }]}>
                    <Text style={[styles.avatarText, { color: statusColor }]}>{initials}</Text>
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.candidateName} numberOfLines={1}>{item.full_name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}10` }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{item.status?.toUpperCase() || 'NEW'}</Text>
                        </View>
                    </View>
                    <Text style={styles.positionText}>{item.applied_position || 'Not Specified'}</Text>
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                        <Text style={styles.metaText}>{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Recent'}</Text>
                        <View style={styles.dotSeparator} />
                        <Ionicons name="mail-outline" size={12} color="#94a3b8" />
                        <Text style={styles.metaText}>Active</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Pipeline</Text>
                        <Text style={styles.mainTitle}>Recruitment</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('CandidateEdit')}
                        style={styles.addBtn}
                    >
                        <Ionicons name="add-circle" size={40} color="#0f172a" />
                    </TouchableOpacity>
                </View>

                {/* SEARCH */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="#94a3b8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Find candidate by name or position..."
                            placeholderTextColor="#94a3b8"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* FILTERS */}
                <View style={styles.filterSection}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={statuses}
                        keyExtractor={(s) => s}
                        contentContainerStyle={styles.filterList}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.filterPill, selectedStatus === item && styles.filterPillActive]}
                                onPress={() => setSelectedStatus(item)}
                            >
                                <Text style={[styles.filterText, selectedStatus === item && styles.filterTextActive]}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </SafeAreaView>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : (
                <FlatList
                    data={filteredCandidates}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={renderCandidate}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f172a" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="search-outline" size={40} color="#cbd5e1" />
                            </View>
                            <Text style={styles.emptyText}>No matching candidates</Text>
                            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    headerSafeArea: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    addBtn: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        borderRadius: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    filterSection: {
        paddingBottom: 16,
    },
    filterList: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterPill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterPillActive: {
        backgroundColor: '#0f172a',
        borderColor: '#0f172a',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    filterTextActive: {
        color: 'white',
    },
    listContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    candidateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
    },
    cardContent: {
        flex: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    candidateName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    positionText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        marginLeft: 4,
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#cbd5e1',
        marginHorizontal: 8,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#475569',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
    },
});
