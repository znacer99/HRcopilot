import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius, Shadow, Typography } from '../styles/theme';

/**
 * Reusable Button Component - Professional 2026 Redesign
 */
export default function Button({
    variant = 'primary',
    size = 'md',
    title,
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = true,
    onPress,
    style,
    textStyle,
}) {
    const { colors } = useTheme();

    const styles = getStyles(colors);

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    container: styles.primaryContainer,
                    text: styles.primaryText,
                    iconColor: '#ffffff',
                };
            case 'secondary':
                return {
                    container: styles.secondaryContainer,
                    text: styles.secondaryText,
                    iconColor: colors.primary,
                };
            case 'danger':
                return {
                    container: styles.dangerContainer,
                    text: styles.dangerText,
                    iconColor: '#ffffff',
                };
            case 'success':
                return {
                    container: styles.successContainer,
                    text: styles.successText,
                    iconColor: '#ffffff',
                };
            case 'ghost':
                return {
                    container: styles.ghostContainer,
                    text: styles.ghostText,
                    iconColor: colors.accent,
                };
            case 'outline':
                return {
                    container: styles.outlineContainer,
                    text: styles.outlineText,
                    iconColor: colors.text,
                };
            default:
                return {
                    container: styles.primaryContainer,
                    text: styles.primaryText,
                    iconColor: '#ffffff',
                };
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    container: styles.sizeSm,
                    text: styles.textSm,
                    iconSize: 16,
                };
            case 'lg':
                return {
                    container: styles.sizeLg,
                    text: styles.textLg,
                    iconSize: 22,
                };
            default:
                return {
                    container: styles.sizeMd,
                    text: styles.textMd,
                    iconSize: 18,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const sizeStyles = getSizeStyles();

    return (
        <TouchableOpacity
            style={[
                styles.base,
                variantStyles.container,
                sizeStyles.container,
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'secondary' || variant === 'ghost' || variant === 'outline' ? colors.accent : '#ffffff'}
                    size="small"
                />
            ) : (
                <View style={styles.content}>
                    {icon && iconPosition === 'left' && (
                        <Feather
                            name={icon}
                            size={sizeStyles.iconSize}
                            color={disabled ? colors.textSecondary : variantStyles.iconColor}
                            style={styles.iconLeft}
                        />
                    )}
                    <Text style={[
                        styles.text,
                        variantStyles.text,
                        sizeStyles.text,
                        disabled && styles.disabledText,
                        textStyle,
                    ]}>
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Feather
                            name={icon}
                            size={sizeStyles.iconSize}
                            color={disabled ? colors.textSecondary : variantStyles.iconColor}
                            style={styles.iconRight}
                        />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

const getStyles = (colors) => StyleSheet.create({
    base: {
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        ...Typography.button,
        textAlign: 'center',
    },
    fullWidth: {
        width: '100%',
    },

    // Variants
    primaryContainer: {
        backgroundColor: colors.primary,
        ...Shadow.medium,
    },
    primaryText: {
        color: '#ffffff',
    },

    secondaryContainer: {
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        ...Shadow.subtle,
    },
    secondaryText: {
        color: colors.primary,
    },

    dangerContainer: {
        backgroundColor: colors.error,
        ...Shadow.subtle,
    },
    dangerText: {
        color: '#ffffff',
    },

    successContainer: {
        backgroundColor: colors.success,
        ...Shadow.subtle,
    },
    successText: {
        color: '#ffffff',
    },

    ghostContainer: {
        backgroundColor: 'transparent',
    },
    ghostText: {
        color: colors.accent,
    },

    outlineContainer: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    outlineText: {
        color: colors.text,
    },

    // Sizes
    sizeSm: {
        height: 38,
        paddingHorizontal: Spacing.md,
    },
    textSm: {
        fontSize: 13,
    },

    sizeMd: {
        height: 48,
        paddingHorizontal: Spacing.lg,
    },
    textMd: {
        fontSize: 15,
    },

    sizeLg: {
        height: 56,
        paddingHorizontal: Spacing.xl,
    },
    textLg: {
        fontSize: 17,
    },

    // States
    disabled: {
        backgroundColor: colors.border,
        borderColor: colors.border,
        shadowOpacity: 0,
        elevation: 0,
    },
    disabledText: {
        color: colors.textSecondary,
    },

    // Icons
    iconLeft: {
        marginRight: Spacing.sm,
    },
    iconRight: {
        marginLeft: Spacing.sm,
    },
});
