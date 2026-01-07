import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow, Typography } from '../styles/theme';
import styles from '../styles/styles';

function deriveAppRole(userRole = "") {
    const r = userRole.toLowerCase();
    if (r.includes("it_manager")) return "admin";
    if (r.includes("manager") || r.includes("director") || r.includes("ceo")) return "manager";
    return "employee";
}

export default function MoreScreen({ navigation, user }) {
    const appRole = deriveAppRole(user?.role);

    const getMenuItems = () => {
        const baseItems = [
            {
                id: 'docs',
                title: 'Files',
                subtitle: 'Document repository',
                icon: 'cloud-done-outline',
                color: Colors.accent,
                screen: 'Docs',
            },
        ];

        if (appRole === 'admin' || appRole === 'manager') {
            return [
                {
                    id: 'management',
                    title: 'Management',
                    subtitle: 'Control center',
                    icon: 'shield-checkmark-outline',
                    color: Colors.primary,
                    screen: 'ManagementHub',
                },
                ...baseItems,
                {
                    id: 'work',
                    title: 'Work',
                    subtitle: 'Attendance & leave',
                    icon: 'calendar-outline',
                    color: Colors.warning,
                    screen: 'Work',
                },
                {
                    id: 'depts',
                    title: 'Organization',
                    subtitle: 'Units',
                    icon: 'business-outline',
                    color: Colors.success,
                    screen: 'Depts',
                },
            ];
        }

        return baseItems;
    };

    const menuItems = getMenuItems();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={localStyles.header} edges={['top']}>
                <View style={localStyles.topBar}>
                    <Text style={styles.screenTitle}>Tools</Text>
                    <Text style={styles.screenSubtitle}>System Extensions</Text>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={localStyles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={localStyles.grid}>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={localStyles.menuCard}
                            onPress={() => navigation.navigate(item.screen)}
                            activeOpacity={0.8}
                        >
                            <View style={localStyles.menuCardInner}>
                                <View style={[localStyles.iconBox, { backgroundColor: `${item.color}10` }]}>
                                    <Ionicons name={item.icon} size={26} color={item.color} />
                                </View>
                                <Text style={localStyles.menuTitle}>{item.title}</Text>
                                <Text style={localStyles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={localStyles.helpCard}>
                    <View style={localStyles.helpHeader}>
                        <Text style={localStyles.helpTitle}>Intelligence</Text>
                    </View>
                    <Text style={localStyles.helpText}>
                        Access organizational tools and unified document archives directly from this hub.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const localStyles = StyleSheet.create({
    header: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    topBar: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    menuCard: {
        width: '50%',
        padding: 6,
    },
    menuCardInner: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.subtle,
        height: 160,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    menuTitle: {
        ...Typography.h2,
        fontSize: 15,
        marginBottom: 4,
    },
    menuSubtitle: {
        ...Typography.caption,
        color: Colors.textSecondary,
    },
    helpCard: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.xl,
        padding: Spacing.xl,
        marginTop: 32,
        ...Shadow.medium,
    },
    helpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    helpTitle: {
        ...Typography.body,
        fontWeight: '800',
        color: 'white',
    },
    helpText: {
        ...Typography.body,
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 20,
    },
});
