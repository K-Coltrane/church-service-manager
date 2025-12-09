"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, RefreshControl } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { databaseService, type Service } from "../services/database"
import { syncService, type SyncStatus } from "../services/sync"

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">

interface Props {
  navigation: HomeScreenNavigationProp
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [activeService, setActiveService] = useState<Service | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced")
  const [refreshing, setRefreshing] = useState(false)

  const loadActiveService = async () => {
    try {
      const service = await databaseService.getActiveService()
      setActiveService(service)
    } catch (error) {
      console.error("Error loading active service:", error)
    }
  }

  const updateSyncStatus = async () => {
    const status = await syncService.getSyncStatus()
    setSyncStatus(status)
  }

  useFocusEffect(
    useCallback(() => {
      loadActiveService()
      updateSyncStatus()
    }, []),
  )

  useEffect(() => {
    const statusListener = (status: SyncStatus) => {
      setSyncStatus(status)
    }

    syncService.addStatusListener(statusListener)
    syncService.startAutoSync()

    return () => {
      syncService.removeStatusListener(statusListener)
    }
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadActiveService()
    await updateSyncStatus()
    setRefreshing(false)
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
        return "All synced"
      case "pending":
        return "Sync pending"
      case "syncing":
        return "Syncing..."
      case "error":
        return "Sync error"
      default:
        return "Unknown"
    }
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Church Service Manager</Text>
        <TouchableOpacity style={styles.syncStatus} onPress={() => navigation.navigate("SyncStatus")}>
          <View style={[styles.syncDot, { backgroundColor: getSyncStatusColor() }]} />
          <Text style={styles.syncText}>{getSyncStatusText()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeService ? (
          <View style={styles.activeServiceCard}>
            <Text style={styles.cardTitle}>Active Service</Text>
            <Text style={styles.serviceType}>{activeService.service_type_name}</Text>
            {activeService.location && <Text style={styles.serviceLocation}>{activeService.location}</Text>}
            <Text style={styles.serviceTime}>Started: {new Date(activeService.started_at).toLocaleTimeString()}</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate("ActiveService", { serviceId: activeService.local_id })}
            >
              <Text style={styles.primaryButtonText}>Manage Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noServiceCard}>
            <Text style={styles.cardTitle}>No Active Service</Text>
            <Text style={styles.noServiceText}>Start a new service to begin checking in visitors</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("StartService")}>
              <Text style={styles.primaryButtonText}>Start New Service</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("SyncStatus")}>
            <Text style={styles.actionButtonText}>View Sync Status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("RecentCheckIns")}>
            <Text style={styles.actionButtonText}>View Recent Check-ins</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 14,
    color: "#64748b",
  },
  content: {
    padding: 20,
    gap: 24,
  },
  activeServiceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  noServiceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6366f1",
    marginBottom: 4,
  },
  serviceLocation: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  serviceTime: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  noServiceText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  quickActions: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionButtonText: {
    fontSize: 16,
    color: "#1e293b",
    textAlign: "center",
  },
})

export default HomeScreen
