// Removed "use client" directive for React Native
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import "react-native-get-random-values"
import AppNavigator from "./navigation/AppNavigator"

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
    <>
      <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
      <AppNavigator />
    </>
  )
}

