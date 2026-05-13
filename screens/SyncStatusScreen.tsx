"use client"

import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import AppButton from "../components/ui/AppButton"
import ScreenHeader from "../components/ui/ScreenHeader"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { databaseService } from "../services/database"
import { syncService, type SyncStatus } from "../services/sync"
import { colors, radii, shadowCard, shadowSoft, spacing, typography } from "../theme/modernTheme"

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "SyncStatus">
}

const SyncStatusScreen: React.FC<Props> = ({ navigation }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced")
  const [isSyncing, setIsSyncing] = useState(false)
  const [unsyncedCounts, setUnsyncedCounts] = useState({
    services: 0,
    visitors: 0,
    attendance: 0,
  })

  const load = async () => {
    try {
      const status = await syncService.getSyncStatus()
      setSyncStatus(status)

      const [services, visitors, attendance] = await Promise.all([
        databaseService.getUnsyncedServices(),
        databaseService.getUnsyncedVisitors(),
        databaseService.getUnsyncedAttendance(),
      ])

      setUnsyncedCounts({
        services: services.length,
        visitors: visitors.length,
        attendance: attendance.length,
      })
    } catch (error) {
      console.error("Error loading sync status:", error)
    }
  }

  useEffect(() => {
    load()

    const statusListener = (status: SyncStatus) => {
      setSyncStatus(status)
      setIsSyncing(status === "syncing")
    }

    syncService.addStatusListener(statusListener)
    return () => syncService.removeStatusListener(statusListener)
  }, [])

  const handleSync = async () => {
    try {
      setIsSyncing(true)
      await syncService.syncAll()
      await load()
    } catch (error: any) {
      Alert.alert("Sync Failed", error?.message || "Failed to sync data. Please try again.")
    } finally {
      setIsSyncing(false)
    }
  }

  const totalUnsynced = unsyncedCounts.services + unsyncedCounts.visitors + unsyncedCounts.attendance
  const isPending = totalUnsynced > 0

  const statusConfig = useMemo(() => {
    if (syncStatus === "error") {
      return {
        icon: "!",
        title: "Sync error",
        sub: "Check your connection and try again.",
        variant: "dark" as const,
      }
    }
    if (syncStatus === "syncing") {
      return {
        icon: "↻",
        title: "Syncing",
        sub: "Uploading data…",
        variant: "primary" as const,
      }
    }
    if (isPending) {
      return {
        icon: "↻",
        title: "Sync pending",
        sub: `${totalUnsynced} record${totalUnsynced !== 1 ? "s" : ""} waiting to upload`,
        variant: "light" as const,
      }
    }
    return {
      icon: "✓",
      title: "All synced",
      sub: "Your data is up to date",
      variant: "primary" as const,
    }
  }, [isPending, syncStatus, totalUnsynced])

  const statusCardStyle =
    statusConfig.variant === "dark"
      ? styles.statusCardDark
      : statusConfig.variant === "light"
        ? styles.statusCardLight
        : styles.statusCardPrimary

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Sync Status" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, statusCardStyle]}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconWrap}>
              <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            </View>
            <View style={styles.statusText}>
              <Text style={[styles.statusTitle, statusConfig.variant === "dark" && styles.statusTitleLight]}>
                {statusConfig.title}
              </Text>
              <Text style={[styles.statusSub, statusConfig.variant === "dark" && styles.statusSubLight]}>
                {statusConfig.sub}
              </Text>
            </View>
          </View>
          {isPending && (
            <AppButton title="Sync Now" onPress={handleSync} loading={isSyncing} disabled={isSyncing} style={styles.syncBtn} />
          )}
        </View>

        <Text style={styles.sectionLabel}>Unsynced Records</Text>
        <View style={styles.card}>
          {[
            { label: "Services", count: unsyncedCounts.services },
            { label: "Visitors", count: unsyncedCounts.visitors },
            { label: "Attendance records", count: unsyncedCounts.attendance },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <View style={[styles.badge, row.count > 0 ? styles.badgePending : styles.badgeSynced]}>
                <Text style={[styles.badgeText, row.count > 0 ? styles.badgeTextPending : styles.badgeTextSynced]}>
                  {row.count > 0 ? `${row.count} pending` : "Synced"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Sync</Text>
          <Text style={styles.infoText}>
            This app works offline-first. Data is stored locally and synced when you're online.
          </Text>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1, paddingHorizontal: spacing.lg },

  statusCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadowCard,
  },
  statusCardPrimary: {
    backgroundColor: colors.primaryDark,
  },
  statusCardLight: {
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  statusCardDark: {
    backgroundColor: colors.primaryDark,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusIcon: { fontSize: 20, color: "#fff", fontWeight: "700" },
  statusText: { flex: 1 },
  statusTitle: { ...typography.h3, color: "#fff" },
  statusTitleLight: { color: colors.primaryDark },
  statusSub: { ...typography.bodySmall, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  statusSubLight: { color: colors.textSecondary },
  syncBtn: { marginTop: spacing.md },

  sectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadowSoft,
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLabel: { ...typography.body, color: colors.text },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  badgePending: {
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  badgeSynced: {
    backgroundColor: colors.primaryDark,
  },
  badgeText: { ...typography.caption, fontWeight: "600" },
  badgeTextPending: { color: colors.primaryDark },
  badgeTextSynced: { color: "#fff" },

  infoCard: {
    backgroundColor: colors.primaryBg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  infoTitle: { ...typography.h4, color: colors.primaryDark, marginBottom: spacing.sm },
  infoText: { ...typography.bodySmall, color: colors.textSecondary },
})

export default SyncStatusScreen
