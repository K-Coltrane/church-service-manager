"use client"

import type React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { colors, spacing, typography } from "../../theme/modernTheme"

interface ScreenHeaderProps {
  title: string
  onBack?: () => void
  right?: React.ReactNode
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, right }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.side}>{right}</View>
      </View>
      <View style={styles.accent} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.canvas,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  side: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 24,
    color: colors.primaryDark,
    fontWeight: "300",
    marginTop: -2,
    marginLeft: -2,
  },
  title: {
    flex: 1,
    textAlign: "center",
    ...typography.title,
    fontSize: 17,
    color: colors.primaryDark,
  },
  accent: {
    height: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: 1,
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
  },
})

export default ScreenHeader
