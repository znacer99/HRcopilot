import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';

function deriveAppRole(userRole = "") {
    const r = userRole.toLowerCase();
    if (r.includes("it_manager")) return "admin";
    if (r.includes("manager") || r.includes("director") || r.includes("ceo")) return "manager";
    return "employee";
}

export default function MoreScreen({ navigation, user }) {
    const { isDarkMode, toggleTheme, colors } = useTheme();
    const insets = useSafeAreaInsets();
    const appRole = deriveAppRole(user?.role);

    const getMenuItems = () => {
        const baseItems = [
            {
                id: 'docs',
                title: 'Files',
                subtitle: 'Document repository',
                icon: 'cloud-done-outline',
                screen: 'Documents',
                color: colors.primary,
            },
        ];

        if (appRole === 'admin' || appRole === 'manager') {
            return [
                {
                    id: 'management',
                    title: 'Management',
                    subtitle: 'Control center',
                    icon: 'shield-checkmark-outline',
                    screen: 'ManagementHub',
                    color: colors.accent,
                },
                ...baseItems,
                {
                    id: 'work',
                    title: 'Work',
                    subtitle: 'Attendance & leave',
                    icon: 'calendar-outline',
                    screen: 'Work',
                    color: colors.success,
                },
                {
                    id: 'depts',
                    title: 'Organization',
                    subtitle: 'Units',
                    icon: 'business-outline',
                    screen: 'Depts',
                    color: colors.warning,
                },
            ];
        }

        return baseItems;
    };

    const menuItems = getMenuItems();
    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <View style={styles.topBar}>
                    <View>
                        <Text style={styles.screenTitle}>Governance</Text>
                        <Text style={styles.screenSubtitle}>ALGHAITH Group Utilities</Text>
                    </View>
                    <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={isDarkMode ? "sunny" : "moon"} size={22} color={colors.accent} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.grid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.menuCard}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.menuCardInner}>
                                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                                    <Ionicons name={item.icon} size={28} color={item.color} />
                                </View>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle-outline" size={24} color={colors.accent} />
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={styles.infoTitle}>ALGHAITH Operational Protocol</Text>
                            <Text style={styles.infoText}>
                                All governance tools are subject to ALGHAITH International Group Security Policy.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: Spacing.md,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    screenTitle: {
        ...Typography.h2,
        color: colors.text,
    },
    screenSubtitle: {
        ...Typography.subtitle,
        color: colors.textSecondary,
        marginTop: -2,
    },
    themeToggle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    menuCard: {
        width: '47%',
        aspectRatio: 1,
    },
    menuCardInner: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: Radius.xl,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
    },
    menuSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
    infoSection: {
        marginTop: 32,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
});
