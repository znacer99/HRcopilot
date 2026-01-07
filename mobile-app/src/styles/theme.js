// src/styles/theme.js

export const Colors = {
    primary: '#0F172A',      // Slate 900 - Deep Professional
    primaryLight: '#1E293B', // Slate 800
    accent: '#3B82F6',       // Blue 500 - Refined Action Color
    background: '#F9FAFB',   // Slate 50 - Cleaner background
    surface: '#FFFFFF',      // Pure White
    text: '#0F172A',         // Slate 900 - High contrast text
    textSecondary: '#64748B',// Slate 500 - Subdued subtext
    border: '#F1F5F9',       // Slate 100 - Extra subtle borders
    success: '#10B981',      // Emerald 500
    error: '#EF4444',        // Red 400
    warning: '#F59E0B',      // Amber 500
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const Radius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
};

export const Shadow = {
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
};

export const Typography = {
    h1: {
        fontSize: 26,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0F172A',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748B',
        lineHeight: 22,
        fontWeight: '500',
    },
    body: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 20,
        fontWeight: '400',
    },
    caption: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    button: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
};
