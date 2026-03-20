"use client"

import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import React, { useCallback, useState } from "react"
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { databaseService, type Attendance, type Service, type Visitor } from "../services/database"
import { colors, radii, shadowCard, shadowSoft, spacing, typography } from "../theme/modernTheme"

type RecentCheckInsScreenNavigationProp = StackNavigationProp<RootStackParamList, "RecentCheckIns">

interface Props {
  navigation: RecentCheckInsScreenNavigationProp
}

interface CheckInRecord extends Attendance {
  visitor: Visitor
  service: Service
}

const RecentCheckInsScreen: React.FC<Props> = ({ navigation: _navigation }: Props) => {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadRecentCheckIns = async () => {
    try {
      const recent = await databaseService.getRecentCheckIns(100)
      setCheckIns(recent)
    } catch (error) {
      console.error("Error loading recent check-ins:", error)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadRecentCheckIns()
    }, []),
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRecentCheckIns()
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const renderItem = ({ item, index }: { item: CheckInRecord; index: number }) => {
    const fullName = `${item.visitor.first_name} ${item.visitor.last_name}`.trim()
    return (
      <View style={[styles.card, index === 0 && styles.cardFirst]}>
        <View style={styles.cardAccent} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{fullName || "—"}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.chip, styles.chipCyan]}>
              <Text style={styles.chipLabel}>Phone</Text>
              <Text style={styles.chipValue} numberOfLines={1}>
                {item.visitor.phone || "—"}
              </Text>
            </View>
            <View style={[styles.chip, styles.chipMint]}>
              <Text style={styles.chipLabel}>Service</Text>
              <Text style={styles.chipValue} numberOfLines={2}>
                {item.service.service_type_name || "—"}
              </Text>
            </View>
          </View>
          <View style={styles.footerRow}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{formatDate(item.checked_in_at)}</Text>
            </View>
            <Text style={styles.timeText}>{formatTime(item.checked_in_at)}</Text>
          </View>
        </View>
      </View>
    )
  }

  const ListHeader = () => (
    <View style={styles.hero}>
      <Text style={styles.heroEyebrow}>Activity</Text>
      <Text style={styles.heroTitle}>Recent check-ins</Text>
      <View style={styles.statPill}>
        <Text style={styles.statNumber}>{checkIns.length}</Text>
        <Text style={styles.statLabel}>total records</Text>
      </View>
    </View>
  )

  const ListEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No check-ins yet</Text>
        <Text style={styles.emptySub}>Start a service and check in visitors to see them here.</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.screen}>
      <FlatList
        data={checkIns}
        keyExtractor={(item) => item.local_id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[
          styles.listContent,
          checkIns.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator
        // Critical for web + native: single vertical scroll surface
        style={styles.list}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
    paddingTop: spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  hero: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadowCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  heroEyebrow: {
    ...typography.small,
    color: colors.cyan,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.hero,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.canvasAlt,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadowSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardFirst: {
    marginTop: 0,
  },
  cardAccent: {
    height: 4,
    width: "100%",
    backgroundColor: colors.primary,
  },
  cardBody: {
    padding: spacing.md,
  },
  name: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  metaRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
  },
  chipCyan: {
    backgroundColor: colors.cyanSoft,
    borderColor: "#a5f3fc",
  },
  chipMint: {
    backgroundColor: colors.mintSoft,
    borderColor: "#a7f3d0",
  },
  chipLabel: {
    ...typography.small,
    color: colors.textMuted,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipValue: {
    ...typography.body,
    color: colors.text,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  datePill: {
    backgroundColor: colors.coralSoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  datePillText: {
    ...typography.caption,
    color: colors.coral,
    fontWeight: "700",
  },
  timeText: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    minHeight: 280,
    paddingVertical: spacing.xl,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: "center",
    ...shadowSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
})

export default RecentCheckInsScreen
