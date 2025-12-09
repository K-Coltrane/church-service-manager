"use client"

import type React from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"

// Import screens
import SplashScreen from "../screens/SplashScreen"
import HomeScreen from "../screens/HomeScreen"
import StartServiceScreen from "../screens/service/StartServiceScreen"
import ActiveServiceScreen from "../screens/service/ActiveServiceScreen"
import AddVisitorScreen from "../screens/visitor/AddVisitorScreen"
import SearchVisitorScreen from "../screens/visitor/SearchVisitorScreen"
import SyncStatusScreen from "../screens/SyncStatusScreen"
import RecentCheckInsScreen from "../screens/RecentCheckInsScreen"

export type RootStackParamList = {
  Splash: undefined
  Home: undefined
  StartService: undefined
  ActiveService: { serviceId: string }
  AddVisitor: { serviceId: string }
  SearchVisitor: { serviceId: string }
  SyncStatus: undefined
  RecentCheckIns: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
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
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
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
        <Stack.Screen name="RecentCheckIns" component={RecentCheckInsScreen} options={{ title: "Recent Check-ins" }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
