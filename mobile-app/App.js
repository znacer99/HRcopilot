import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
      // Force clear for debugging purposes if needed, otherwise:
      if (savedUser) {
        // Simple validity check
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setUser(parsed);
        } else {
          // Invalid data found, clear it
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("token");
        }
      }
    } catch (e) {
      console.log("Failed to load session", e);
    }
    setLoading(false);
  };

  const handleLogin = async (userData) => {
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
        {/* Emergency Logout Button if stuck loading */}
        <TouchableOpacity onPress={handleLogout} style={{ marginTop: 20, padding: 10 }}>
          <Text style={{ color: '#666' }}>Stuck? Tap to Reset</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {!user ? (
          <LoginScreen onLogin={handleLogin} />
        ) : user.role === 'employee' ? (
          <EmployeeDashboardScreen user={user} onLogout={handleLogout} />
        ) : (
          <MainStack user={user} onLogout={handleLogout} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
