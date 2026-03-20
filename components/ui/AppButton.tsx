"use client"

import type React from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native"
import { colors, radii, shadowButton, typography } from "../../theme/modernTheme"

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

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outline" && styles.outline,
        variant === "danger" && styles.danger,
        variant === "success" && styles.success,
        variant === "ghost" && styles.ghost,
        variant === "primary" && !isDisabled && shadowButton,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost" ? colors.primary : "#fff"
          }
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" && styles.labelOnPrimary,
            variant === "secondary" && styles.labelOnPrimary,
            variant === "outline" && styles.labelOutline,
            variant === "danger" && styles.labelOnPrimary,
            variant === "success" && styles.labelOnPrimary,
            variant === "ghost" && styles.labelGhost,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.cyan,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  success: {
    backgroundColor: colors.mint,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.subtitle,
  },
  labelOnPrimary: {
    color: "#fff",
  },
  labelOutline: {
    color: colors.primary,
  },
  labelGhost: {
    color: colors.primary,
  },
})

export default AppButton
