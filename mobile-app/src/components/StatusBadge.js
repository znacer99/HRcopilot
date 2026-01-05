import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
  hired: '#10b981',
  interview: '#f59e0b',
  applied: '#3b82f6',
  default: '#6b7280',
};

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const key = status.toLowerCase();
  const bgColor = STATUS_COLORS[key] || STATUS_COLORS.default;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default StatusBadge;
