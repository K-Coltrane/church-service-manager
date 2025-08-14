// Removed "use client" directive for React Native
import "react-native-get-random-values"
import { StatusBar } from "expo-status-bar"
import { AuthProvider } from "./context/AuthContext"
import AppNavigator from "./navigation/AppNavigator"
import { useEffect } from "react"

export default function App() {
  useEffect(() => {
    // Test crypto functionality on app start
    try {
      const testUuid = require("uuid").v4()
      console.log("Crypto polyfill working, test UUID:", testUuid)
    } catch (error) {
      console.error("Crypto polyfill error:", error)
    }
  }, [])

  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#6366f1" />
      <AppNavigator />
    </AuthProvider>
  )
}
