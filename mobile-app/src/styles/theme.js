// src/styles/theme.js
// HR 2026 Professional Design System with Light/Dark Mode Support

// Light Mode Colors (default)
export const LightColors = {
    primary: '#0F172A',      // Slate 900 - Deep Professional
    primaryLight: '#1E293B', // Slate 800
    accent: '#3B82F6',       // Blue 500 - Refined Action Color
    background: '#F9FAFB',   // Slate 50 - Cleaner background
    surface: '#FFFFFF',      // Pure White
    text: '#0F172A',         // Slate 900 - High contrast text
    textSecondary: '#64748B',// Slate 500 - Subdued subtext
    border: '#E5E7EB',       // Gray 200 - Visible but subtle
    success: '#10B981',      // Emerald 500
    error: '#EF4444',        // Red 400
    warning: '#F59E0B',      // Amber 500
};

// Dark Mode Colors
export const DarkColors = {
    primary: '#3B82F6',      // Blue 500 - Accent becomes primary
    primaryLight: '#60A5FA', // Blue 400
    accent: '#14B8A6',       // Teal 500 - Secondary accent
    background: '#1F2937',   // Gray 800 - Dark background
    surface: '#111827',      // Gray 900 - Card surfaces
    text: '#FFFFFF',         // White text
    textSecondary: '#D1D5DB',// Gray 300 - Subdued text
    border: '#374151',       // Gray 700 - Subtle borders
    success: '#10B981',      // Emerald 500
    error: '#EF4444',        // Red 400
    warning: '#F59E0B',      // Amber 500
};

// Default export for backwards compatibility
export const Colors = LightColors;

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
    lg: 16,
    xl: 20,
    full: 9999,
};

export const Shadow = {
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
};

export const Typography = {
    h1: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
    },
    caption: {
        fontSize: 12,
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
