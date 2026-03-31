"use client"

import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useEffect, useRef } from "react"
import { Animated, Image, StyleSheet, View } from "react-native"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { colors, typography } from "../theme/modernTheme"

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, "Splash">

interface Props {
  navigation: SplashScreenNavigationProp
}

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.86)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const tagOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 70, friction: 10 }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(tagOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
    ]).start()

    const timer = setTimeout(() => {
      navigation.replace("Home")
    }, 3000)

    return () => clearTimeout(timer)
  }, [navigation])

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image source={require("../assets/images/logo.png")} style={styles.logo} />
      </Animated.View>
      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>Balance Church</Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Smart church attendance{"\n"}offline-first & always ready
      </Animated.Text>
      <View style={styles.loaderTrack}>
        <View style={styles.loaderBar} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 18,
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  tagline: {
    ...typography.body,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
  },
  loaderTrack: {
    width: 56,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    overflow: "hidden",
  },
  loaderBar: {
    width: "60%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
  },
})

export default SplashScreen
