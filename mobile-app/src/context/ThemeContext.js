// src/context/ThemeContext.js
// Global theme provider for HR 2026 design system

import React, { createContext, useState, useContext, useMemo } from 'react';
import { LightColors, DarkColors, Spacing, Radius, Shadow, Typography } from '../styles/theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    const value = useMemo(() => ({
        isDarkMode,
        toggleTheme,
        colors: isDarkMode ? DarkColors : LightColors,
        spacing: Spacing,
        radius: Radius,
        shadow: Shadow,
        typography: Typography,
    }), [isDarkMode]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
