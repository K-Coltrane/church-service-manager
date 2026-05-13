"use client"

import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Image, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
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
        return colors.primaryDark
      case "pending":
        return colors.primary
      case "syncing":
        return colors.primaryMid
      case "error":
        return colors.primaryDark
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
        <View style={styles.brandRow}>
          <Image source={require("../assets/images/logo.png")} style={styles.brandLogo} />
          <View>
            <Text style={styles.brandName}>Balance Church</Text>
            <Text style={styles.greeting}>{greeting}</Text>
          </View>
        </View>

        <Text style={styles.title}>Dashboard</Text>

        <TouchableOpacity
          style={styles.syncPill}
          onPress={() => navigation.navigate("SyncStatus")}
          activeOpacity={0.8}
        >
          <View style={[styles.syncDot, { backgroundColor: syncDotColor }]} />
          <Text style={styles.syncPillText}>{syncStatusText}</Text>
          <Text style={styles.syncArrow}>›</Text>
        </TouchableOpacity>

        {activeService ? (
          <View style={styles.activeCard}>
            <Text style={styles.activeLabel}>Active Service</Text>
            <Text style={styles.activeName}>{activeService.service_type_name || "Service"}</Text>
            {activeService.location ? <Text style={styles.activeMeta}>{activeService.location}</Text> : null}
            <View style={styles.statsDivider} />
            <View style={styles.statsRow}>
              <Text style={styles.statNum}>{attendanceCount}</Text>
              <Text style={styles.statLbl}>Checked in</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noServiceCard}>
            <View style={styles.noServiceIcon}>
              <Text style={styles.noServiceIconText}>+</Text>
            </View>
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
          <AppButton title="Start New Service" onPress={() => navigation.navigate("StartService")} style={styles.cta} />
        )}

        <Text style={styles.sectionLabel}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate("SyncStatus")} activeOpacity={0.8}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionSymbol}>↻</Text>
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Sync Status</Text>
            <Text style={styles.actionSub}>{syncStatusText}</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate("RecentCheckIns")} activeOpacity={0.8}>
          <View style={styles.actionIcon}>
            <Text style={styles.actionSymbol}>✓</Text>
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Recent Check-ins</Text>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  brandName: {
    ...typography.h4,
    color: colors.primaryDark,
    letterSpacing: -0.2,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  title: {
    ...typography.hero,
    color: colors.text,
    marginBottom: spacing.md,
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.primaryBg,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginBottom: spacing.lg,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncPillText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.primaryDark,
    fontWeight: "500",
  },
  syncArrow: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "300",
  },
  activeCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadowCard,
  },
  activeLabel: {
    ...typography.label,
    color: "rgba(255,255,255,0.65)",
    marginBottom: spacing.xs,
  },
  activeName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  activeMeta: {
    ...typography.bodySmall,
    color: "rgba(255,255,255,0.75)",
  },
  statsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  statNum: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -1,
  },
  statLbl: {
    ...typography.bodySmall,
    color: "rgba(255,255,255,0.7)",
  },
  noServiceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSoft,
  },
  noServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  noServiceIconText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: "300",
  },
  noServiceText: { ...typography.h3, color: colors.text, marginBottom: 6 },
  noServiceSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
  },
  cta: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
    ...shadowSoft,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  actionSymbol: {
    fontSize: 17,
    color: colors.primaryDark,
    fontWeight: "600",
  },
  actionText: { flex: 1, marginLeft: spacing.md },
  actionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  actionSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: "300",
    marginLeft: spacing.sm,
  },
})

export default HomeScreen
