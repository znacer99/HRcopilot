// src/styles/styles.js
import { StyleSheet } from 'react-native';
import { Spacing, Radius, Shadow, Typography } from './theme';

/**
 * Global styles generator that accepts the current theme colors.
 * Use this to get consistent styling across the app.
 */
export const getGlobalStyles = (colors) => StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.background,
  },

  // Headers
  screenHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenTitle: {
    ...Typography.h1,
    color: colors.text,
  },
  screenSubtitle: {
    ...Typography.subtitle,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Component - Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },

  // Component - Input
  field: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: colors.text,
  },

  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
    ...Shadow.medium,
  },
  primaryButtonText: {
    ...Typography.button,
    color: 'white',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: colors.text,
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadow.subtle,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  itemTitle: {
    ...Typography.h2,
    fontSize: 17,
    color: colors.text,
  },
  itemSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },

  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    ...Typography.body,
    color: colors.error,
    textAlign: 'center',
  },
});

// Deprecated default export to avoid breaking old code during transition
// New code should use useTheme() and getGlobalStyles(colors)
export default {};
