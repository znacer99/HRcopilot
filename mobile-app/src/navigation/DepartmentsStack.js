import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import DepartmentsScreen from "../screens/DepartmentsScreen";
import DepartmentDetailScreen from "../screens/DepartmentDetailScreen";

const Stack = createStackNavigator();

export default function DepartmentsStack({ user }) {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Departments" options={{ title: "Departments" }}>
                {(props) => <DepartmentsScreen {...props} user={user} />}
            </Stack.Screen>

            <Stack.Screen name="DepartmentDetail" options={{ title: "Department" }}>
                {(props) => <DepartmentDetailScreen {...props} user={user} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
}
