"use client"

import type React from "react"
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    type StyleProp,
    type TextStyle,
    type ViewStyle,
} from "react-native"
import { colors, radii, shadowButton } from "../../theme/modernTheme"

export type AppButtonVariant = "primary" | "secondary" | "outline" | "danger" | "success" | "ghost"

interface AppButtonProps {
  title: string
  onPress: () => void
  variant?: AppButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}) => {
  const isDisabled = disabled || loading

  const btnStyle: ViewStyle = StyleSheet.flatten([
    styles.base,
    variantStyles[variant].btn,
    variant === "primary" && shadowButton,
    isDisabled && styles.disabled,
    style,
  ])

  const txtStyle: TextStyle = StyleSheet.flatten([styles.text, variantStyles[variant].text])

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={isDisabled} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : colors.primary} size="small" />
      ) : (
        <Text style={txtStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    minHeight: 52,
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
})

const variantStyles: Record<AppButtonVariant, { btn: ViewStyle; text: TextStyle }> = {
  primary: {
    btn: { backgroundColor: colors.primary },
    text: { color: "#fff" },
  },
  secondary: {
    btn: { backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryLight },
    text: { color: colors.primaryDark },
  },
  outline: {
    btn: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary },
    text: { color: colors.primary },
  },
  danger: {
    btn: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primaryDark },
    text: { color: colors.primaryDark },
  },
  success: {
    btn: { backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryLight },
    text: { color: colors.primaryDark },
  },
  ghost: {
    btn: { backgroundColor: "transparent" },
    text: { color: colors.primary },
  },
}

export default AppButton
