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
      <Stack.Screen name="UserList" component={UserListScreen} />
      <Stack.Screen name="UserEdit" component={UserEditScreen} />

      {/* EMPLOYEE ROUTES */}
      <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <Stack.Screen name="EmployeeEdit" component={EmployeeEditScreen} />
      <Stack.Screen name="EmployeeUpload" component={EmployeeUploadScreen} />

      {/* CANDIDATE ROUTES */}
      <Stack.Screen name="CandidateList" component={CandidateListScreen} />
      <Stack.Screen name="CandidateDetail" component={CandidateDetailScreen} />
      <Stack.Screen name="CandidateEdit" component={CandidateEditScreen} />
    </Stack.Navigator>
  );
}
