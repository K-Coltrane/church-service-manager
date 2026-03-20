"use client"

import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import AppButton from "../components/ui/AppButton"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { databaseService, type Service } from "../services/database"
import { syncService, type SyncStatus } from "../services/sync"
import { colors, radii, shadowCard, shadowSoft, spacing, typography } from "../theme/modernTheme"

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
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View>
          <Text style={styles.helloEyebrow}>Welcome back</Text>
          <Text style={styles.helloTitle}>Church Service</Text>
        </View>
        <TouchableOpacity
          style={styles.syncBadge}
          onPress={() => navigation.navigate("SyncStatus")}
          activeOpacity={0.85}
        >
          <View style={[styles.syncDot, { backgroundColor: getSyncStatusColor() }]} />
          <Text style={styles.syncText}>{getSyncStatusText()}</Text>
        </TouchableOpacity>
      </View>

      {activeService ? (
        <View style={styles.heroCard}>
          <View style={styles.heroAccent} />
          <Text style={styles.cardEyebrow}>Live session</Text>
          <Text style={styles.cardTitle}>Active service</Text>
          <Text style={styles.serviceType}>{activeService.service_type_name}</Text>
          {activeService.location ? (
            <Text style={styles.serviceMeta}>{activeService.location}</Text>
          ) : null}
          <Text style={styles.serviceMeta}>
            Started {new Date(activeService.started_at).toLocaleTimeString()}
          </Text>
          <AppButton
            title="Manage service"
            onPress={() => navigation.navigate("ActiveService", { serviceId: activeService.local_id })}
            style={styles.cardButton}
          />
        </View>
      ) : (
        <View style={[styles.heroCard, styles.heroCardMuted]}>
          <View style={[styles.heroAccent, styles.heroAccentMuted]} />
          <Text style={styles.cardEyebrow}>Ready when you are</Text>
          <Text style={styles.cardTitle}>No active service</Text>
          <Text style={styles.mutedBody}>Start a service to check in visitors and track attendance.</Text>
          <AppButton title="Start new service" onPress={() => navigation.navigate("StartService")} style={styles.cardButton} />
        </View>
      )}

      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionTile}
          onPress={() => navigation.navigate("SyncStatus")}
          activeOpacity={0.9}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.cyanSoft }]}>
            <Text style={styles.actionIconText}>↻</Text>
          </View>
          <Text style={styles.actionTitle}>Sync status</Text>
          <Text style={styles.actionHint}>Cloud & offline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionTile}
          onPress={() => navigation.navigate("RecentCheckIns")}
          activeOpacity={0.9}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.mintSoft }]}>
            <Text style={styles.actionIconText}>✓</Text>
          </View>
          <Text style={styles.actionTitle}>Recent check-ins</Text>
          <Text style={styles.actionHint}>Last 100 visits</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  helloEyebrow: {
    ...typography.small,
    color: colors.cyan,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  helloTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSoft,
  },
  syncDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  syncText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...shadowCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  heroCardMuted: {
    borderColor: colors.border,
  },
  heroAccent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 5,
    backgroundColor: colors.primary,
  },
  heroAccentMuted: {
    backgroundColor: colors.textMuted,
  },
  cardEyebrow: {
    ...typography.small,
    color: colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primaryDark,
    marginBottom: 4,
  },
  serviceMeta: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  mutedBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  cardButton: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadowSoft,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  actionIconText: {
    fontSize: 20,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  actionTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: 4,
  },
  actionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
})

export default HomeScreen
