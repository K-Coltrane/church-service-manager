"use client"

import type { StackNavigationProp } from "@react-navigation/stack"
import { StatusBar } from "expo-status-bar"
import type React from "react"
import { useEffect } from "react"
import { Dimensions, Image, StyleSheet, Text, View } from "react-native"
import * as Animatable from "react-native-animatable"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { colors, typography } from "../theme/modernTheme"

const { width } = Dimensions.get("window")
const logoSize = Math.min(width * 0.72, 320)

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, "Splash">

interface Props {
  navigation: SplashScreenNavigationProp
}

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Home")
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigation])

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.glow} />
        <Animatable.View animation="fadeInUp" duration={900} easing="ease-out" style={styles.animationContainer}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../assets/images/Logo.jpg")}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
            />
          </View>
          <Text style={styles.tagline}>Service Manager</Text>
          <Text style={styles.subtag}>Check-ins made simple</Text>
        </Animatable.View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  glow: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: colors.primaryLight,
    opacity: 0.45,
    top: "15%",
  },
  animationContainer: {
    alignItems: "center",
  },
  logoWrap: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    resizeMode: "cover",
  },
  tagline: {
    marginTop: 28,
    ...typography.hero,
    color: "#fff",
    textAlign: "center",
  },
  subtag: {
    marginTop: 8,
    ...typography.body,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
})

export default SplashScreen
