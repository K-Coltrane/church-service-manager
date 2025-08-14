"use client"

import type React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import { useAuth } from "../context/AuthContext"

// Import screens
import LoginScreen from "../screens/auth/LoginScreen"
import HomeScreen from "../screens/HomeScreen"
import StartServiceScreen from "../screens/service/StartServiceScreen"
import ActiveServiceScreen from "../screens/service/ActiveServiceScreen"
import AddVisitorScreen from "../screens/visitor/AddVisitorScreen"
import SearchVisitorScreen from "../screens/visitor/SearchVisitorScreen"
import SyncStatusScreen from "../screens/SyncStatusScreen"

export type RootStackParamList = {
  Login: undefined
  Home: undefined
  StartService: undefined
  ActiveService: { serviceId: string }
  AddVisitor: { serviceId: string }
  SearchVisitor: { serviceId: string }
  SyncStatus: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null // You could add a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#6366f1",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Church Service Manager" }} />
            <Stack.Screen name="StartService" component={StartServiceScreen} options={{ title: "Start New Service" }} />
            <Stack.Screen name="ActiveService" component={ActiveServiceScreen} options={{ title: "Active Service" }} />
            <Stack.Screen name="AddVisitor" component={AddVisitorScreen} options={{ title: "Add New Visitor" }} />
            <Stack.Screen
              name="SearchVisitor"
              component={SearchVisitorScreen}
              options={{ title: "Check In Visitor" }}
            />
            <Stack.Screen name="SyncStatus" component={SyncStatusScreen} options={{ title: "Sync Status" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
