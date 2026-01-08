import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from "../api/apiService";
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';

export default function DepartmentDetailScreen({ route, navigation }) {
    const { colors, isDarkMode, toggleTheme } = useTheme();
    const id = route?.params?.id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await apiService.getDepartment(id);
            setData(res?.department || null);
        } catch (e) {
            setErrorMsg(e?.message || "Resource synchronization failed");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const employees = data?.employees || [];
    const styles = getStyles(colors);

    if (loading && !data) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleBox}>
                        <Text style={styles.headerTitle}>Unit Overview</Text>
                    </View>
                    <TouchableOpacity onPress={toggleTheme} style={styles.headerBtn}>
                        <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.heroSection}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="business" size={40} color={colors.accent} />
                    </View>
                    <Text style={styles.deptName}>{data?.name || "Unit Directory"}</Text>
                    {!!data?.description && (
                        <Text style={styles.deptDesc}>{data.description}</Text>
                    )}
                    <View style={styles.statsBadge}>
                        <Ionicons name="people" size={14} color={colors.textSecondary} />
                        <Text style={styles.statsText}>{employees.length} Personnel Resources</Text>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Assigned Staff</Text>
                </View>

                {errorMsg ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={20} color={colors.error} />
                        <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                ) : null}

                {employees.length > 0 ? (
                    employees.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.staffCard}
                            onPress={() => navigation.navigate("EmployeeDetail", { employee: item })}
                        >
                            <View style={styles.avatarMini}>
                                <Text style={styles.avatarText}>{item.full_name?.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.staffInfo}>
                                <Text style={styles.staffName}>{item.full_name}</Text>
                                <Text style={styles.staffRole}>{item.job_title || "Personnel"}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.border} />
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyBox}>
                        <Ionicons name="people-outline" size={48} color={colors.border} />
                        <Text style={styles.emptyText}>No personnel assigned to this unit.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// Fixed ScrollView import
import { ScrollView } from "react-native";

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleBox: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        ...Typography.h3,
        color: colors.text,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 32,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: `${colors.accent}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...Shadow.subtle,
    },
    deptName: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
    },
    deptDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    statsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Radius.lg,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statsText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    sectionHeader: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: 16,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    staffCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: Spacing.lg,
        padding: 16,
        borderRadius: Radius.xl,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    avatarMini: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 16,
    },
    staffInfo: {
        flex: 1,
        marginLeft: 14,
    },
    staffName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    staffRole: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
        marginTop: 16,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.error}10`,
        marginHorizontal: Spacing.lg,
        padding: 12,
        borderRadius: 10,
        gap: 10,
        marginBottom: 16,
    },
    errorText: {
        color: colors.error,
        fontSize: 13,
        fontWeight: '600',
    },
});
