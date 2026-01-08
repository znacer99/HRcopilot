// src/navigation/MainStack.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import TabNavigator from "./TabNavigator";
import EmployeeDetailScreen from "../screens/EmployeeDetailScreen";
import EmployeeEditScreen from "../screens/EmployeeEditScreen";
import EmployeeUploadScreen from "../screens/EmployeeUploadScreen";
import CandidateDetailScreen from "../screens/CandidateDetailScreen";
import CandidateEditScreen from "../screens/CandidateEditScreen";
import CandidateListScreen from "../screens/CandidateListScreen";
import ManagementHubScreen from "../screens/ManagementHubScreen";
import UserListScreen from "../screens/UserListScreen";
import UserEditScreen from "../screens/UserEditScreen";
import DocumentsScreen from "../screens/DocumentsScreen";

const Stack = createStackNavigator();

export default function MainStack({ user, onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* MAIN TABS */}
      <Stack.Screen name="Tabs">
        {(props) => <TabNavigator {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>

      {/* MANAGEMENT ROUTES */}
      <Stack.Screen name="ManagementHub">
        {(props) => <ManagementHubScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="UserList">
        {(props) => <UserListScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="UserEdit">
        {(props) => <UserEditScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="Documents">
        {(props) => <DocumentsScreen {...props} user={user} />}
      </Stack.Screen>

      {/* EMPLOYEE ROUTES */}
      <Stack.Screen name="EmployeeDetail">
        {(props) => <EmployeeDetailScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="EmployeeEdit">
        {(props) => <EmployeeEditScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="EmployeeUpload" component={EmployeeUploadScreen} />

      {/* CANDIDATE ROUTES */}
      <Stack.Screen name="CandidateList">
        {(props) => <CandidateListScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="CandidateDetail">
        {(props) => <CandidateDetailScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="CandidateEdit">
        {(props) => <CandidateEditScreen {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
