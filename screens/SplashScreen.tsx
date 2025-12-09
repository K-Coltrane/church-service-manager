"use client"

import type { StackNavigationProp } from "@react-navigation/stack"
import { StatusBar } from "expo-status-bar"
import type React from "react"
import { useEffect } from "react"
import { Dimensions, Image, StyleSheet, View } from "react-native"
import * as Animatable from "react-native-animatable"
import type { RootStackParamList } from "../navigation/AppNavigator"

const { width } = Dimensions.get("window")
const logoSize = width * 0.95 // 95% of screen width

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
      <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
      <View style={styles.container}>
        <Animatable.View animation="zoomIn" duration={1200} easing="ease-out" style={styles.animationContainer}>
          <Image
            source={require("../assets/images/Logo.jpg")}
            style={[styles.logo, { width: logoSize, height: logoSize }]}
          />
        </Animatable.View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  animationContainer: {
    alignItems: "center",
  },
  logo: {
    resizeMode: "contain",
    borderRadius: 16,
  },
})

export default SplashScreen

