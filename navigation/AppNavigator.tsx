"use client"

import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import type React from "react"

// Import screens
import HomeScreen from "../screens/HomeScreen"
import RecentCheckInsScreen from "../screens/RecentCheckInsScreen"
import ActiveServiceScreen from "../screens/service/ActiveServiceScreen"
import StartServiceScreen from "../screens/service/StartServiceScreen"
import SplashScreen from "../screens/SplashScreen"
import SyncStatusScreen from "../screens/SyncStatusScreen"
import AddVisitorScreen from "../screens/visitor/AddVisitorScreen"
import SearchVisitorScreen from "../screens/visitor/SearchVisitorScreen"
import { colors, shadowSoft } from "../theme/modernTheme"

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
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.primaryDark,
            ...shadowSoft,
            shadowColor: colors.primaryDark,
            shadowOpacity: 0.25,
            elevation: 8,
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 18,
            letterSpacing: -0.3,
          },
          headerShadowVisible: true,
          cardStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen name="StartService" component={StartServiceScreen} />
        <Stack.Screen name="ActiveService" component={ActiveServiceScreen} />
        <Stack.Screen name="AddVisitor" component={AddVisitorScreen} />
        <Stack.Screen
          name="SearchVisitor"
          component={SearchVisitorScreen}
        />
        <Stack.Screen name="SyncStatus" component={SyncStatusScreen} />
        <Stack.Screen name="RecentCheckIns" component={RecentCheckInsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
