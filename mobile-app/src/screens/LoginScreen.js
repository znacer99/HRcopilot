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
import Card from "../components/Card";

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
        return;
      }

      await AsyncStorage.setItem("user", JSON.stringify(result.user));
      await AsyncStorage.setItem("token", result.token);

      onLogin(result.user);
    } catch (e) {
      setError("Unable to connect. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* <Ionicons name="briefcase" size={48} color="#fff" /> */}
          <Text style={styles.headerTitle}>ALGHAITH</Text>
          <Text style={styles.headerTitle}>
            International Group
          </Text>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* JOB SEEKER NOTICE */}
          <View style={styles.jobCard}>
            <View style={styles.jobIcon}>
              <Ionicons name="person-add" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobTitle}>Looking for a Job?</Text>
              <Text style={styles.jobText}>
                Browse our open positions and create your candidate account.
              </Text>
              <TouchableOpacity
                style={styles.jobButton}
                onPress={() => onNavigate?.("jobs")}
              >
                <Text style={styles.jobButtonText}>
                  View Job Openings & Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* EMPLOYEE NOTICE */}
          <View style={styles.employeeCard}>
            <Ionicons
              name="business"
              size={18}
              color="#2563eb"
              style={{ marginTop: 2 }}
            />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.employeeTitle}>Current Employees</Text>
              <Text style={styles.employeeText}>
                Use the credentials sent to you by HR. Contact HR if you did not
                receive them.
              </Text>
            </View>
          </View>

          {/* LOGIN FORM */}
          <Text style={styles.loginTitle}>Sign In</Text>
          <Text style={styles.loginSubtitle}>Access your account</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.group}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail" size={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="your.email@company.com"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed" size={18} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2563eb" },
  scroll: { flexGrow: 1 },

  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff", marginTop: 8 },
  headerSubtitle: { fontSize: 14, color: "#dbeafe", marginTop: 4 },

  content: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },

  jobCard: {
    flexDirection: "row",
    backgroundColor: "#ecfeff",
    borderColor: "#86efac",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  jobIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  jobTitle: { fontSize: 14, fontWeight: "600", color: "#064e3b" },
  jobText: { fontSize: 12, color: "#065f46", marginVertical: 4 },
  jobButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  jobButtonText: {
    color: "#fff",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
  },

  employeeCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  employeeTitle: { fontSize: 13, fontWeight: "600", color: "#1e3a8a" },
  employeeText: { fontSize: 11, color: "#1e40af", marginTop: 2 },

  loginTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  loginSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },

  group: { marginBottom: 14 },
  label: { fontSize: 13, color: "#374151", marginBottom: 6 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
  },

  loginButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  disabled: { backgroundColor: "#9ca3af" },
  error: { color: "#dc2626", textAlign: "center", marginBottom: 10 },
});
