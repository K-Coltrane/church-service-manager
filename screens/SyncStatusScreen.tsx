"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from "react-native"
import { syncService, type SyncStatus } from "../services/sync"
import { databaseService } from "../services/database"

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
        return "#10b981"
      case "pending":
        return "#f59e0b"
      case "syncing":
        return "#3b82f6"
      case "error":
        return "#ef4444"
      default:
        return "#6b7280"
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
        return 'Some data is waiting to be synced. Connect to the internet and tap "Sync Now" to upload.'
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, { backgroundColor: getSyncStatusColor() }]} />
            <Text style={styles.statusTitle}>{getSyncStatusText()}</Text>
          </View>

          <Text style={styles.statusDescription}>{getSyncStatusDescription()}</Text>

          {syncStatus === "pending" && (
            <TouchableOpacity
              style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
              onPress={handleManualSync}
              disabled={isSyncing}
            >
              {isSyncing ? <ActivityIndicator color="#fff" /> : <Text style={styles.syncButtonText}>Sync Now</Text>}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Sync Details</Text>

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
            <Text style={styles.detailLabel}>Attendance Records</Text>
            <View style={styles.detailValue}>
              <Text style={styles.detailNumber}>{unsyncedCounts.attendance}</Text>
              <Text style={styles.detailUnit}>unsynced</Text>
            </View>
          </View>

          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Unsynced</Text>
            <Text style={styles.totalNumber}>{totalUnsynced}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Sync</Text>
          <Text style={styles.infoText}>
            This app works offline-first. All your data is stored locally and automatically synced when you have an
            internet connection. You can continue using the app even without internet access.
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    gap: 20,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  statusDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
  },
  syncButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailLabel: {
    fontSize: 14,
    color: "#374151",
  },
  detailValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  detailUnit: {
    fontSize: 12,
    color: "#64748b",
  },
  totalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#e2e8f0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  totalNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6366f1",
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
})

export default SyncStatusScreen
