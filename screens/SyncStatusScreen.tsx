"use client"

import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import AppButton from "../components/ui/AppButton"
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
        icon: "⚠",
        title: "Sync error",
        sub: "Check your connection and try again.",
        bg: colors.coralSoft,
        border: "#fecdd3",
      }
    }
    if (syncStatus === "syncing") {
      return {
        icon: "↻",
        title: "Syncing",
        sub: "Uploading data…",
        bg: colors.cyanSoft,
        border: "#a5f3fc",
      }
    }
    if (isPending) {
      return {
        icon: "↻",
        title: "Sync pending",
        sub: `${totalUnsynced} record${totalUnsynced !== 1 ? "s" : ""} waiting to upload`,
        bg: "#fffbeb",
        border: "#fde68a",
      }
    }
    return {
      icon: "✓",
      title: "All synced",
      sub: "Your data is up to date",
      bg: colors.mintSoft,
      border: "#a7f3d0",
    }
  }, [isPending, syncStatus, totalUnsynced])

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Sync Status</Text>
        <View style={styles.topRight} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconWrap}>
              <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            </View>
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>{statusConfig.title}</Text>
              <Text style={styles.statusSub}>{statusConfig.sub}</Text>
            </View>
          </View>
          {isPending && (
            <AppButton title="Sync Now" onPress={handleSync} loading={isSyncing} disabled={isSyncing} style={styles.syncBtn} />
          )}
        </View>

        <Text style={styles.sectionTitle}>Unsynced records</Text>
        <View style={styles.card}>
          {[
            { label: "Services", count: unsyncedCounts.services },
            { label: "Visitors", count: unsyncedCounts.visitors },
            { label: "Attendance records", count: unsyncedCounts.attendance },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <View style={[styles.badge, { backgroundColor: row.count > 0 ? "#fef3c7" : colors.mintSoft }]}>
                <Text style={[styles.badgeText, { color: row.count > 0 ? "#92400e" : colors.mint }]}>
                  {row.count > 0 ? `${row.count} pending` : "Synced"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About sync</Text>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadowSoft,
  },
  backIcon: { fontSize: 22, color: colors.primary, marginTop: -2 },
  topTitle: { flex: 1, textAlign: "center", ...typography.title, color: colors.text },
  topRight: { width: 36 },

  scroll: { flex: 1, paddingHorizontal: spacing.md },

  statusCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadowCard,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.md },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusIcon: { fontSize: 22, color: colors.primaryDark, fontWeight: "800" },
  statusText: { flex: 1 },
  statusTitle: { ...typography.title, color: colors.text },
  statusSub: { ...typography.body, color: colors.textSecondary, marginTop: 2, lineHeight: 20 },
  syncBtn: { marginTop: spacing.xs },

  sectionTitle: { ...typography.subtitle, color: colors.text, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    ...shadowSoft,
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  badgeText: { ...typography.caption, fontWeight: "700" },

  infoCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: { ...typography.subtitle, color: colors.text, marginBottom: spacing.sm },
  infoText: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
})

export default SyncStatusScreen
