"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native"
import AppButton from "../components/ui/AppButton"
import { databaseService } from "../services/database"
import { syncService, type SyncStatus } from "../services/sync"
import { colors, radii, shadowCard, shadowSoft, spacing, typography } from "../theme/modernTheme"

const SyncStatusScreen: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced")
  const [isSyncing, setIsSyncing] = useState(false)
  const [unsyncedCounts, setUnsyncedCounts] = useState({
    services: 0,
    visitors: 0,
    attendance: 0,
  })

  useEffect(() => {
    loadSyncStatus()

    const statusListener = (status: SyncStatus) => {
      setSyncStatus(status)
      setIsSyncing(status === "syncing")
    }

    syncService.addStatusListener(statusListener)

    return () => {
      syncService.removeStatusListener(statusListener)
    }
  }, [])

  const loadSyncStatus = async () => {
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

  const handleManualSync = async () => {
    try {
      setIsSyncing(true)
      await syncService.syncAll()
      await loadSyncStatus()
      Alert.alert("Success", "All data has been synced successfully!")
    } catch (error: any) {
      Alert.alert("Sync Failed", error.message || "Failed to sync data. Please try again.")
    } finally {
      setIsSyncing(false)
    }
  }

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case "synced":
        return colors.mint
      case "pending":
        return colors.amber
      case "syncing":
        return colors.info
      case "error":
        return colors.error
      default:
        return colors.textMuted
    }
  }

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case "synced":
        return "All data is synced"
      case "pending":
        return "Sync pending"
      case "syncing":
        return "Syncing in progress..."
      case "error":
        return "Sync error occurred"
      default:
        return "Unknown status"
    }
  }

  const getSyncStatusDescription = () => {
    switch (syncStatus) {
      case "synced":
        return "All your local data has been successfully uploaded to the server."
      case "pending":
        return 'Some data is waiting to be synced. Connect to the internet and tap "Sync now" to upload.'
      case "syncing":
        return "Your data is currently being uploaded to the server. Please wait..."
      case "error":
        return "There was an error syncing your data. Check your internet connection and try again."
      default:
        return ""
    }
  }

  const totalUnsynced = unsyncedCounts.services + unsyncedCounts.visitors + unsyncedCounts.attendance

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statusCard}>
        <View style={[styles.statusRibbon, { backgroundColor: getSyncStatusColor() }]} />
        <View style={styles.statusHeader}>
          <View style={[styles.statusDot, { backgroundColor: getSyncStatusColor() }]} />
          <Text style={styles.statusTitle}>{getSyncStatusText()}</Text>
        </View>
        <Text style={styles.statusDescription}>{getSyncStatusDescription()}</Text>
        {syncStatus === "pending" && (
          <AppButton
            title="Sync now"
            onPress={handleManualSync}
            loading={isSyncing}
            disabled={isSyncing}
            variant="primary"
            style={styles.syncBtn}
          />
        )}
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Sync details</Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Services</Text>
          <View style={styles.detailValue}>
            <Text style={styles.detailNumber}>{unsyncedCounts.services}</Text>
            <Text style={styles.detailUnit}>unsynced</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Visitors</Text>
          <View style={styles.detailValue}>
            <Text style={styles.detailNumber}>{unsyncedCounts.visitors}</Text>
            <Text style={styles.detailUnit}>unsynced</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Attendance</Text>
          <View style={styles.detailValue}>
            <Text style={styles.detailNumber}>{unsyncedCounts.attendance}</Text>
            <Text style={styles.detailUnit}>unsynced</Text>
          </View>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total unsynced</Text>
          <Text style={styles.totalNumber}>{totalUnsynced}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>About sync</Text>
        <Text style={styles.infoText}>
          This app works offline-first. Data is stored locally and synced when you're online. You can keep using
          the app without internet.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
    gap: spacing.md,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: "hidden",
    ...shadowCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statusRibbon: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 4,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTitle: {
    ...typography.title,
    color: colors.text,
    flex: 1,
  },
  statusDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  syncBtn: {
    marginTop: spacing.xs,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadowSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  detailsTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  detailUnit: {
    ...typography.caption,
    color: colors.textMuted,
  },
  totalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    marginTop: spacing.xs,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.subtitle,
    color: colors.text,
  },
  totalNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
})

export default SyncStatusScreen
