import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PeopleStack from "./PeopleStack";
import WorkScreen from "../screens/WorkScreen";

// TEMP / PLACEHOLDERS
import DocumentsScreen from "../screens/DocumentsScreen";
import DepartmentsScreen from "../screens/DepartmentsScreen";

const Tab = createBottomTabNavigator();

/**
 * UI-ONLY ROLE DERIVATION (FINAL)
 * IT MANAGER = ADMIN
 */
function deriveAppRole(userRole = "") {
  const r = userRole.toLowerCase();

  if (r.includes("it_manager")) return "admin";
  if (r.includes("manager") || r.includes("director") || r.includes("ceo"))
    return "manager";

  return "employee";
}

export default function TabNavigator({ user, onLogout }) {
  console.log("TAB USER:", user);
  const appRole = deriveAppRole(user?.role);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home: focused ? "home" : "home-outline",
            Profile: focused ? "person" : "person-outline",
            Staff: focused ? "people" : "people-outline",
            Hiring: focused ? "person-add" : "person-add-outline",
            Work: focused ? "briefcase" : "briefcase-outline",
            Docs: focused ? "document-text" : "document-text-outline",
            Depts: focused ? "business" : "business-outline",
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      {/* COMMON — ALL USERS */}
      <Tab.Screen name="Home">
        {(props) => (
          <HomeScreen {...props} user={user} onLogout={onLogout} />
        )}
      </Tab.Screen>

      <Tab.Screen name="Profile">
        {(props) => (
          <ProfileScreen {...props} onLogout={onLogout} />
        )}
      </Tab.Screen>

      {/* ADMIN + MANAGER */}
      {(appRole === "admin" || appRole === "manager") && (
        <>
          <Tab.Screen
            name="Staff"
            component={PeopleStack}
            initialParams={{ mode: "employees", user }}
          />
          <Tab.Screen
            name="Hiring"
            component={PeopleStack}
            initialParams={{ mode: "candidates", user }}
          />
          <Tab.Screen name="Work">
            {(props) => <WorkScreen {...props} user={user} />}
          </Tab.Screen>
          <Tab.Screen name="Docs">
            {(props) => <DocumentsScreen {...props} user={user} />}
          </Tab.Screen>
          <Tab.Screen name="Depts" component={DepartmentsScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}
