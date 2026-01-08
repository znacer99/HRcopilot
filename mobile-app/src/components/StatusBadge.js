import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Radius, Typography } from '../styles/theme';

const StatusBadge = ({ status }) => {
  const { colors } = useTheme();

  if (!status) return null;

  const getStatusStyle = (status) => {
    const key = status.toLowerCase();
    switch (key) {
      case 'approved':
      case 'hired':
      case 'resolved':
      case 'live':
        return { color: colors.success, bg: `${colors.success}15` };
      case 'pending':
      case 'interview':
      case 'wip':
      case 'in-progress':
        return { color: colors.warning, bg: `${colors.warning}15` };
      case 'rejected':
      case 'error':
      case 'failed':
        return { color: colors.error, bg: `${colors.error}15` };
      case 'applied':
      case 'new':
      case 'active':
        return { color: colors.accent, bg: `${colors.accent}15` };
      default:
        return { color: colors.textSecondary, bg: colors.border };
    }
  };

  const statusStyle = getStatusStyle(status);

  return (
    <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
      <Text style={[styles.text, { color: statusStyle.color }]}>{status.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  text: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default StatusBadge;
