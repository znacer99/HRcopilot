import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import PeopleScreen from "../screens/PeopleScreen";
import EmployeeDetailScreen from "../screens/EmployeeDetailScreen";
import CandidateDetailScreen from "../screens/CandidateDetailScreen";

const Stack = createStackNavigator();

export default function PeopleStack({ route }) {
  console.log("PEOPLE STACK PARAMS:", route?.params);
  const mode = route?.params?.mode ?? "employees";

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="People">
        {(props) => (
          <PeopleScreen
            {...props}
            user={route.params?.user}
            mode={route.params?.mode}
          />
        )}
      </Stack.Screen>


      {mode === "employees" && (
        <Stack.Screen name="EmployeeDetail">
          {(props) => (
            <EmployeeDetailScreen
              {...props}
              route={{
                ...props.route,
                params: {
                  ...props.route.params,
                  user: route.params?.user,
                },
              }}
            />
          )}
        </Stack.Screen>
      )}

      {mode === "candidates" && (
        <Stack.Screen
          name="CandidateDetail"
          component={CandidateDetailScreen}
        />
      )}
    </Stack.Navigator>
  );
}
