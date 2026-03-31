"use client"

import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
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
  const [attendanceCount, setAttendanceCount] = useState<number>(0)

  const loadActiveService = async () => {
    try {
      const service = await databaseService.getActiveService()
      setActiveService(service)

      if (service) {
        const attendance = await databaseService.getServiceAttendance(service.local_id)
        setAttendanceCount(attendance.length)
      } else {
        setAttendanceCount(0)
      }
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

  const syncDotColor = useMemo(() => {
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
  }, [syncStatus])

  const syncStatusText = useMemo(() => {
    switch (syncStatus) {
      case "synced":
        return "All data synced"
      case "pending":
        return "Records waiting to upload"
      case "syncing":
        return "Syncing..."
      case "error":
        return "Sync error"
      default:
        return "Unknown"
    }
  }, [syncStatus])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting} <Text style={styles.wave}>👋</Text>
          </Text>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity
            style={styles.syncPill}
            onPress={() => navigation.navigate("SyncStatus")}
            activeOpacity={0.85}
          >
            <View style={[styles.syncDot, { backgroundColor: syncDotColor }]} />
            <Text style={styles.syncPillText}>{syncStatusText}</Text>
          </TouchableOpacity>
        </View>

        {activeService ? (
          <View style={styles.activeCard}>
            <View style={styles.activeAccent} />
            <Text style={styles.activeLabel}>ACTIVE SERVICE</Text>
            <Text style={styles.activeName}>{activeService.service_type_name || "Service"}</Text>
            {activeService.location ? <Text style={styles.activeMeta}>{activeService.location}</Text> : null}
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statNum}>{attendanceCount}</Text>
                <Text style={styles.statLbl}>Checked in</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noServiceCard}>
            <Text style={styles.noServiceIcon}>🏛</Text>
            <Text style={styles.noServiceText}>No active service</Text>
            <Text style={styles.noServiceSub}>Start a service to begin checking in attendees.</Text>
          </View>
        )}

        {activeService ? (
          <AppButton
            title="Manage Active Service"
            onPress={() => navigation.navigate("ActiveService", { serviceId: activeService.local_id })}
            style={styles.cta}
          />
        ) : (
          <AppButton title="+ Start New Service" onPress={() => navigation.navigate("StartService")} style={styles.cta} />
        )}

        <Text style={styles.sectionTitle}>Quick actions</Text>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate("SyncStatus")} activeOpacity={0.85}>
          <View style={[styles.actionIcon, { backgroundColor: colors.cyanSoft }]}>
            <Text style={styles.actionEmoji}>↻</Text>
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Sync status</Text>
            <Text style={styles.actionSub}>{syncStatusText}</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate("RecentCheckIns")} activeOpacity={0.85}>
          <View style={[styles.actionIcon, { backgroundColor: colors.mintSoft }]}>
            <Text style={styles.actionEmoji}>✓</Text>
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Recent check-ins</Text>
            <Text style={styles.actionSub}>View last 100 entries</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.md,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  wave: { fontSize: 13 },
  title: {
    ...typography.hero,
    color: colors.text,
  },
  syncPill: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  syncPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  activeCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadowCard,
  },
  activeAccent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    backgroundColor: colors.cyan,
  },
  activeLabel: {
    ...typography.small,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  activeName: {
    ...typography.title,
    color: "#fff",
    fontSize: 18,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  activeMeta: {
    ...typography.caption,
    color: "rgba(255,255,255,0.75)",
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: 18,
    marginTop: spacing.xs,
  },
  statNum: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
  },
  statLbl: {
    ...typography.caption,
    color: "rgba(255,255,255,0.7)",
  },
  noServiceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSoft,
  },
  noServiceIcon: { fontSize: 32, marginBottom: spacing.sm },
  noServiceText: { ...typography.title, color: colors.text, marginBottom: 4 },
  noServiceSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  cta: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    ...shadowSoft,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionEmoji: {
    fontSize: 18,
    color: colors.primaryDark,
    fontWeight: "700",
  },
  actionText: { flex: 1, marginLeft: spacing.sm },
  actionTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  actionSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  actionArrow: {
    fontSize: 22,
    color: colors.textMuted,
    marginLeft: spacing.sm,
    marginTop: -2,
  },
})

export default HomeScreen
