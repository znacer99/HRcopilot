import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RequestsScreen from "../screens/RequestsScreen";
import MoreScreen from "../screens/MoreScreen";
import PeopleStack from "./PeopleStack";
import WorkScreen from "../screens/WorkScreen";
import DocumentsScreen from "../screens/DocumentsScreen";
import DepartmentsStack from "./DepartmentsStack";
import CandidateListScreen from "../screens/CandidateListScreen";

// Theme
import { useTheme } from "../context/ThemeContext";
import { Spacing, Radius, Shadow } from "../styles/theme";

const Tab = createBottomTabNavigator();

/**
 * ROLE DERIVATION
 */
function deriveAppRole(userRole = "") {
  const r = userRole.toLowerCase();
  if (r.includes("it_manager")) return "admin";
  if (r.includes("manager") || r.includes("director") || r.includes("ceo")) {
    return "manager";
  }
  return "employee";
}

/**
 * Custom Tab Bar Icon with Badge
 */
function TabIcon({ name, focused, color, badge }) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={24} color={color} />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabNavigator({ user, onLogout }) {
  const { colors } = useTheme();
  const appRole = deriveAppRole(user?.role);

  const screenOptions = ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      height: Platform.OS === 'ios' ? 88 : 72,
      paddingTop: 8,
      paddingBottom: Platform.OS === 'ios' ? 28 : 12,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      ...Shadow.medium,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    tabBarIconStyle: {
      marginTop: 0,
    },
  });

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      {/* HOME - All Users */}
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      >
        {(props) => <HomeScreen {...props} user={user} onLogout={onLogout} />}
      </Tab.Screen>

      {/* ADMIN & MANAGER: Show Team/People */}
      {(appRole === "admin" || appRole === "manager") && (
        <Tab.Screen
          name="Staff"
          component={PeopleStack}
          initialParams={{ mode: "employees", user }}
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                name={focused ? "people" : "people-outline"}
                focused={focused}
                color={color}
              />
            ),
          }}
        />
      )}

      {/* EMPLOYEE ONLY: Show Documents directly */}
      {appRole === "employee" && (
        <Tab.Screen
          name="Documents"
          options={{
            tabBarLabel: "Docs",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                name={focused ? "document-text" : "document-text-outline"}
                focused={focused}
                color={color}
              />
            ),
          }}
        >
          {(props) => <DocumentsScreen {...props} user={user} />}
        </Tab.Screen>
      )}

      {/* REQUESTS - All Users */}
      <Tab.Screen
        name="Requests"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "mail" : "mail-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      >
        {(props) => <RequestsScreen {...props} user={user} />}
      </Tab.Screen>

      {/* ADMIN & MANAGER: More Menu */}
      {(appRole === "admin" || appRole === "manager") && (
        <Tab.Screen
          name="Gov"
          options={{
            tabBarLabel: "Governance",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon
                name={focused ? "grid" : "grid-outline"}
                focused={focused}
                color={color}
              />
            ),
          }}
        >
          {(props) => <MoreScreen {...props} user={user} />}
        </Tab.Screen>
      )}

      {/* PROFILE - All Users */}
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              focused={focused}
              color={color}
            />
          ),
        }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>

      {/* HIDDEN SCREENS (Accessible from More menu) */}
      {(appRole === "admin" || appRole === "manager") && (
        <>
          <Tab.Screen
            name="Recruitment"
            options={{ tabBarButton: () => null }}
          >
            {(props) => <CandidateListScreen {...props} user={user} />}
          </Tab.Screen>
          <Tab.Screen
            name="Work"
            options={{ tabBarButton: () => null }}
          >
            {(props) => <WorkScreen {...props} user={user} />}
          </Tab.Screen>
          <Tab.Screen
            name="Depts"
            options={{ tabBarButton: () => null }}
          >
            {(props) => <DepartmentsStack {...props} user={user} />}
          </Tab.Screen>
        </>
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
