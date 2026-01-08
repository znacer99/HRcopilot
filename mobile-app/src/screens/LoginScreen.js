import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import { Spacing, Radius, Shadow, Typography } from "../styles/theme";
import apiService from "../api/apiService";
import Button from "../components/Button";

const { width } = Dimensions.get('window');

/**
 * Login Screen - HR 2026 Premium Portal
 */
export default function LoginScreen({ onLogin }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Credentials required for authentication.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await apiService.login(email.trim(), password.trim());
      if (result.success) {
        onLogin(result.user, result.token);
      } else {
        setError(result.message || "Authentication rejected.");
      }
    } catch (err) {
      setError("Network infrastructure offline.");
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Theme Toggle Overlay */}
          <TouchableOpacity onPress={toggleTheme} style={[styles.themeToggle, { top: Math.max(insets.top, 10) }]}>
            <Ionicons
              name={isDarkMode ? "sunny" : "moon"}
              size={24}
              color={colors.accent}
            />
          </TouchableOpacity>

          {/* BRANDING HERO */}
          <View style={styles.brandHero}>
            <Image
              source={require('../../assets/images/alghaith_logo.jpg')}
              style={styles.heroLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>ALGHAITH</Text>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>HR COPILOT • ENTERPRISE 2026</Text>
            </View>
          </View>

          {/* LOGIN CARD */}
          <View style={styles.loginCard}>
            <Text style={styles.welcomeTitle}>System Entry</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to your professional workspace</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputStack}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>OFFICIAL EMAIL</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="john.doe@company.com"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setError(""); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ACCESS CODE</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(""); }}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Request Access Support</Text>
            </TouchableOpacity>

            <Button
              variant="primary"
              title={loading ? "" : "Initialize Session"}
              loading={loading}
              onPress={handleLogin}
              style={{ marginTop: 10 }}
            />
          </View>

          <Text style={styles.footerNote}>
            Secure end-to-end encrypted protocol.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  themeToggle: {
    position: 'absolute',
    right: 0,
    padding: 12,
    zIndex: 10,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroLogo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 20,
  },
  brandTitle: {
    ...Typography.h1,
    fontSize: 32,
    color: colors.text,
    letterSpacing: 2,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  versionBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  loginCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xxl,
    padding: 28,
    ...Shadow.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeTitle: {
    ...Typography.h2,
    color: colors.text,
  },
  welcomeSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}10`,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  inputStack: {
    gap: 20,
    marginBottom: 12,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
  },
  footerNote: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
