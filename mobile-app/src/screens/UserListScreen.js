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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';
import Button from '../components/Button';

/**
 * User List Screen - Displays all system user accounts
 */
export default function UserListScreen({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [includeInactive, setIncludeInactive] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await apiService.getUsers(includeInactive);
            if (response.success) {
                setUsers(response.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            Alert.alert("Error", "Could not load users list");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [includeInactive]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const handleToggleInactive = () => {
        setLoading(true);
        setIncludeInactive(!includeInactive);
    };

    const handleSuspendToggle = async (user) => {
        try {
            const newStatus = !user.is_active;
            const response = await apiService.updateUser(user.id, { is_active: newStatus });
            if (response.success) {
                // Update local state
                setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
                Alert.alert("Success", `User ${newStatus ? 'activated' : 'suspended'} successfully`);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to update user status");
        }
    };

    const handleDeleteUser = (user) => {
        Alert.alert(
            "Delete User",
            `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await apiService.deleteUser(user.id);
                            if (response.success) {
                                setUsers(users.filter(u => u.id !== user.id));
                                Alert.alert("Deleted", "User has been removed from the system.");
                            }
                        } catch (error) {
                            Alert.alert("Error", error.message || "Failed to delete user");
                        }
                    }
                }
            ]
        );
    };

    const renderUserItem = ({ item }) => (
        <View style={[styles.userCard, !item.is_active && styles.inactiveCard]}>
            <View style={styles.userHeader}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: item.is_active ? '#3b82f6' : '#9ca3af' }]}>
                    <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                    <Text style={styles.roleText}>{item.role.replace('_', ' ').toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Ionicons name="call-outline" size={14} color="#6b7280" />
                    <Text style={styles.detailText}>{item.phone || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="briefcase-outline" size={14} color="#6b7280" />
                    <Text style={styles.detailText}>{item.position || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.actionsRow}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('UserEdit', { userId: item.id })}
                >
                    <Ionicons name="create-outline" size={18} color="#4b5563" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleSuspendToggle(item)}
                >
                    <Ionicons
                        name={item.is_active ? "lock-closed-outline" : "lock-open-outline"}
                        size={18}
                        color={item.is_active ? "#f59e0b" : "#10b981"}
                    />
                    <Text style={[styles.actionBtnText, { color: item.is_active ? "#f59e0b" : "#10b981" }]}>
                        {item.is_active ? 'Suspend' : 'Activate'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeleteUser(item)}
                >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const getRoleColor = (role) => {
        const r = role.toLowerCase();
        if (r.includes('admin') || r.includes('it_manager')) return '#ef4444';
        if (r.includes('director') || r.includes('ceo')) return '#8b5cf6';
        if (r.includes('manager')) return '#3b82f6';
        return '#10b981';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.title}>System Users</Text>
                <TouchableOpacity
                    style={styles.filterBtn}
                    onPress={handleToggleInactive}
                >
                    <Ionicons
                        name={includeInactive ? "eye" : "eye-off"}
                        size={22}
                        color={includeInactive ? "#2563eb" : "#9ca3af"}
                    />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="person-outline" size={64} color="#d1d5db" />
                            <Text style={styles.emptyText}>No users found</Text>
                        </View>
                    }
                />
            )}

            <View style={styles.fabContainer}>
                <Button
                    variant="primary"
                    title="Add User"
                    icon="plus"
                    onPress={() => navigation.navigate('UserEdit')}
                    fullWidth
                />
            </View>
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
        flex: 1,
    },
    filterBtn: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    userCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    inactiveCard: {
        opacity: 0.7,
        backgroundColor: '#f3f4f6',
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarLetter: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    userEmail: {
        fontSize: 13,
        color: '#6b7280',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'white',
    },
    detailsRow: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 13,
        color: '#6b7280',
    },
    actionsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
        justifyContent: 'space-between',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4b5563',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#9ca3af',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
    }
});
