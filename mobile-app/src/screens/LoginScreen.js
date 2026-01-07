import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import apiService from "../api/apiService";
import { Colors, Spacing, Radius, Shadow, Typography } from "../styles/theme";
import Button from "../components/Button";

export default function LoginScreen({ onLogin, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await apiService.login(email, password);

      if (!result.success) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem("user", JSON.stringify(result.user));
      await AsyncStorage.setItem("token", result.token);

      onLogin(result.user);
    } catch (e) {
      setError("Unable to connect. Check your network.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* UPPER BRAND SECTION */}
        <View style={styles.brandHero}>
          <View style={styles.logoCircle}>
            <Ionicons name="business" size={32} color={Colors.accent} />
          </View>
          <Text style={styles.brandName}>ALGHAITH</Text>
        </View>

        {/* FORM CONTAINER */}
        <View style={styles.formSection}>
          <View style={styles.formHeader}>
            <Text style={styles.welcomeText}>Portal</Text>
            <Text style={styles.instructionText}>Sign in to continue</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputStack}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="name@alghaith.com"
                  placeholderTextColor={Colors.textSecondary + '80'}
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textSecondary + '80'}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>
          </View>

          <Button
            title="Sign In"
            loading={loading}
            onPress={handleLogin}
            style={styles.loginBtn}
          />

          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>Secure Connection</Text>
          </View>
        </View>

        {/* SECONDARY ACTION */}
        <TouchableOpacity
          style={styles.jobAction}
          activeOpacity={0.7}
          onPress={() => onNavigate?.("jobs")}
        >
          <Text style={styles.jobActionText}>Looking for opportunities? Browse Careers</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.accent} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandHero: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandLegal: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 4,
    marginTop: 4,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadow.medium,
  },
  formHeader: {
    marginBottom: Spacing.xl,
  },
  welcomeText: {
    ...Typography.h2,
    color: Colors.primary,
  },
  instructionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  inputStack: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  loginBtn: {
    marginTop: Spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: 6,
  },
  footerText: {
    ...Typography.caption,
    fontSize: 11,
  },
  jobAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
    paddingBottom: 40,
  },
  jobActionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  }
});
