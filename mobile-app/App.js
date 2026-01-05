import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";

// SCREENS
import LoginScreen from "./src/screens/LoginScreen";

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
        setUser(JSON.parse(savedUser));
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
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <MainStack user={user} onLogout={handleLogout} />
      )}
    </NavigationContainer>
  );
}
