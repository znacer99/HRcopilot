import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from 'react-native-safe-area-context';

// THEME PROVIDER
import { ThemeProvider } from './src/context/ThemeContext';

// SCREENS
import LoginScreen from "./src/screens/LoginScreen";
import EmployeeDashboardScreen from "./src/screens/EmployeeDashboardScreen";

// NAVIGATION
import MainStack from "./src/navigation/MainStack";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setUser(parsed);
        } else {
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("token");
        }
      }
    } catch (e) {
      console.log("Failed to load session", e);
    }
    setLoading(false);
  };

  const handleLogin = async (userData, token) => {
    try {
      if (token) {
        await AsyncStorage.setItem("token", token);
      }
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      setUser(null);
    } catch (e) {
      console.error("Failed to clear session", e);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <TouchableOpacity onPress={handleLogout} style={{ marginTop: 20, padding: 10 }}>
          <Text style={{ color: '#64748B' }}>Stuck? Tap to Reset</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          {!user ? (
            <LoginScreen onLogin={handleLogin} />
          ) : (
            <MainStack user={user} onLogout={handleLogout} />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
