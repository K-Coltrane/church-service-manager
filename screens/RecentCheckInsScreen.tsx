"use client"

import type { StackNavigationProp } from "@react-navigation/stack"
import React, { useEffect, useMemo, useState } from "react"
import {
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import ScreenHeader from "../components/ui/ScreenHeader"
import type { RootStackParamList } from "../navigation/AppNavigator"
import { databaseService, type Attendance, type Service, type Visitor } from "../services/database"
import { colors, radii, shadowSoft, spacing, typography } from "../theme/modernTheme"

type RecentCheckInsScreenNavigationProp = StackNavigationProp<RootStackParamList, "RecentCheckIns">

interface Props {
  navigation: RecentCheckInsScreenNavigationProp
}

interface CheckInRecord extends Attendance {
  visitor: Visitor
  service: Service
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function timeLabel(iso: string): { time: string; day: string } {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date()
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (isToday) return { time, day: "Today" }
  if (isYesterday) return { time, day: "Yesterday" }
  return { time, day: d.toLocaleDateString([], { month: "short", day: "numeric" }) }
}

const RecentCheckInsScreen: React.FC<Props> = ({ navigation }: Props) => {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState("")

  const loadRecentCheckIns = async () => {
    try {
      const recent = await databaseService.getRecentCheckIns(100)
      setCheckIns(recent)
    } catch (error) {
      console.error("Error loading recent check-ins:", error)
    }
  }

  useEffect(() => {
    loadRecentCheckIns()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadRecentCheckIns()
    setRefreshing(false)
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return checkIns
    return checkIns.filter((c) => {
      const name = `${c.visitor.first_name} ${c.visitor.last_name ?? ""}`.trim().toLowerCase()
      return name.includes(q)
    })
  }, [checkIns, filter])

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <ScreenHeader title="Recent Check-ins" onBack={() => navigation.goBack()} />

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by name..."
          placeholderTextColor={colors.textMuted}
          value={filter}
          onChangeText={setFilter}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.local_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <Text style={styles.countLabel}>
            Showing {filtered.length} check-in{filtered.length !== 1 ? "s" : ""}
          </Text>
        )}
        renderItem={({ item }) => {
          const fullName = `${item.visitor.first_name} ${item.visitor.last_name ?? ""}`.trim() || "—"
          const statusLabel = (item.visitor.status || "Visitor").split(",")[0]?.trim() || "Visitor"
          const tl = timeLabel(item.checked_in_at)
          return (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(fullName || "?")}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{fullName}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{item.service.service_type_name || "Service"}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{statusLabel}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.timeWrap}>
                <Text style={styles.time}>{tl.time}</Text>
                <Text style={[styles.day, tl.day === "Today" && styles.dayToday]}>{tl.day}</Text>
              </View>
            </View>
          )
        }}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No check-ins found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },

  searchRow: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadowSoft,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    paddingTop: 4,
  },
  countLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadowSoft,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  avatarText: { fontSize: 13, fontWeight: "700", color: colors.primaryDark },
  info: { flex: 1, minWidth: 0 },
  name: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  meta: { ...typography.caption, color: colors.textSecondary },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: colors.primaryDark },
  timeWrap: { alignItems: "flex-end" },
  time: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
  day: { fontSize: 10, fontWeight: "600", color: colors.textMuted, marginTop: 2 },
  dayToday: { color: colors.primary },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { ...typography.body, color: colors.textSecondary },
})

export default RecentCheckInsScreen
