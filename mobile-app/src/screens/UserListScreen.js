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
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../api/apiService';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';
import Button from '../components/Button';

/**
 * User List Screen - Displays all system user accounts (HR 2026 Redesign)
 */
export default function UserListScreen({ navigation }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [includeInactive, setIncludeInactive] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await apiService.getUsers(includeInactive);
            if (response.success) {
                setUsers(response.users || []);
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
        <TouchableOpacity
            style={[styles.userCard, !item.is_active && styles.inactiveCard]}
            onPress={() => navigation.navigate('UserEdit', { userId: item.id })}
        >
            <View style={styles.userHeader}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: item.is_active ? colors.accent : colors.textSecondary }]}>
                    <Text style={styles.avatarLetter}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <View style={styles.roleContainer}>
                        <Ionicons name="shield-checkmark" size={14} color={colors.accent} />
                        <Text style={styles.userRole}>{item.role?.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                </View>
                <View style={[styles.statusIndicator, { backgroundColor: item.is_active ? colors.success : colors.error }]} />
            </View>

            <View style={styles.actionToolbar}>
                <TouchableOpacity
                    style={[styles.toolBtn, { backgroundColor: item.is_active ? colors.error + '15' : colors.success + '15' }]}
                    onPress={(e) => { e.stopPropagation(); handleSuspendToggle(item); }}
                >
                    <Ionicons name={item.is_active ? "remove-circle" : "checkmark-circle"} size={20} color={item.is_active ? colors.error : colors.success} />
                    <Text style={[styles.toolText, { color: item.is_active ? colors.error : colors.success }]}>
                        {item.is_active ? 'Suspend' : 'Activate'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.toolBtn, { backgroundColor: colors.error + '15' }]}
                    onPress={(e) => { e.stopPropagation(); handleDeleteUser(item); }}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                    <Text style={[styles.toolText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const styles = getStyles(colors);

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.screenTitle}>Registry</Text>
                        <Text style={styles.screenSubtitle}>ALGHAITH Account Governance</Text>
                    </View>
                    <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
                    </TouchableOpacity>
                </View>

                <View style={styles.configBar}>
                    <TouchableOpacity
                        style={[styles.filterToggle, includeInactive && styles.filterToggleActive]}
                        onPress={handleToggleInactive}
                    >
                        <Ionicons name={includeInactive ? "eye" : "eye-off"} size={18} color={includeInactive ? colors.accent : colors.textSecondary} />
                        <Text style={[styles.filterText, includeInactive && { color: colors.accent }]}>
                            {includeInactive ? 'Showing Inactive' : 'Hide Inactive'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderUserItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={64} color={colors.border} />
                        <Text style={styles.emptyTitle}>No users found</Text>
                        <Text style={styles.emptySubtitle}>System registry is empty or disconnected.</Text>
                    </View>
                }
            />

            <View style={styles.footer}>
                <Button
                    variant="primary"
                    title="Add System Account"
                    icon="user-plus"
                    onPress={() => navigation.navigate('UserEdit')}
                />
            </View>
        </SafeAreaView>
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
        paddingTop: Spacing.sm,
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
    configBar: {
        paddingHorizontal: Spacing.lg,
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    filterToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
    },
    filterToggleActive: {
        borderColor: colors.accent,
        backgroundColor: `${colors.accent}10`,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    listContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    userCard: {
        backgroundColor: colors.surface,
        borderRadius: Radius.xl,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    inactiveCard: {
        opacity: 0.8,
        backgroundColor: colors.background,
    },
    userHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
        marginLeft: 14,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    userEmail: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userRole: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.accent,
        letterSpacing: 0.5,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    actionToolbar: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 16,
        gap: 12,
    },
    toolBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        borderRadius: 10,
        gap: 8,
    },
    toolText: {
        fontSize: 13,
        fontWeight: '700',
    },
    footer: {
        padding: Spacing.lg,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
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
});
