import React from "react";
import { View, Text, StyleSheet } from "react-native";
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

const Tab = createBottomTabNavigator();

/**
 * ROLE DERIVATION
 * IT Manager = Admin
 * Manager/Director/CEO = Manager
 * Everyone else = Employee
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

import { Colors, Spacing, Radius, Shadow, Typography } from "../styles/theme";

export default function TabNavigator({ user, onLogout }) {
  const appRole = deriveAppRole(user?.role);

  // Common screen options for beautiful tab bar
  const screenOptions = ({ route }) => ({
    headerShown: false,
    tabBarActiveTintColor: Colors.accent,
    tabBarInactiveTintColor: Colors.textSecondary,
    tabBarStyle: styles.tabBar,
    tabBarLabelStyle: styles.tabLabel,
    tabBarIconStyle: styles.tabIcon,
  });

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      {/* ═══════════════════════════════════════════════════════════════════
          HOME - All Users
      ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          ROLE-SPECIFIC MIDDLE TABS
      ═══════════════════════════════════════════════════════════════════ */}

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
          name="Docs"
          options={{
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

      {/* ═══════════════════════════════════════════════════════════════════
          REQUESTS - All Users (with badge for managers)
      ═══════════════════════════════════════════════════════════════════ */}
      <Tab.Screen
        name="Requests"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? "mail" : "mail-outline"}
              focused={focused}
              color={color}
            // badge={pendingRequests} // Can add badge later
            />
          ),
        }}
      >
        {(props) => <RequestsScreen {...props} user={user} />}
      </Tab.Screen>

      {/* ═══════════════════════════════════════════════════════════════════
          ADMIN & MANAGER: More Menu (replaces multiple tabs)
      ═══════════════════════════════════════════════════════════════════ */}
      {(appRole === "admin" || appRole === "manager") && (
        <Tab.Screen
          name="Tools"
          options={{
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

      {/* ═══════════════════════════════════════════════════════════════════
          PROFILE - All Users
      ═══════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════
          HIDDEN SCREENS (Accessible from More menu)
      ═══════════════════════════════════════════════════════════════════ */}
      {(appRole === "admin" || appRole === "manager") && (
        <>
          <Tab.Screen
            name="Staff"
            component={PeopleStack}
            initialParams={{ mode: "employees", user }}
            options={{ tabBarButton: () => null }}
          />
          <Tab.Screen
            name="Recruitment"
            component={CandidateListScreen}
            options={{ tabBarButton: () => null }}
          />
          <Tab.Screen
            name="Work"
            options={{ tabBarButton: () => null }}
          >
            {(props) => <WorkScreen {...props} user={user} />}
          </Tab.Screen>
          <Tab.Screen
            name="Docs"
            options={{ tabBarButton: () => null }}
          >
            {(props) => <DocumentsScreen {...props} user={user} />}
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
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIcon: {
    marginTop: 4,
  },
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
