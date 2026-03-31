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
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Member: { bg: "#d1fae5", text: "#065f46" },
  Visitor: { bg: "#dbeafe", text: "#1a6fd4" },
  "First-timer": { bg: "#fef3c7", text: "#92400e" },
  Worker: { bg: "#f3f4f6", text: "#374151" },
  Youth: { bg: "#ede9fe", text: "#5b21b6" },
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

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Recent Check-ins</Text>
        <View style={styles.topRight} />
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
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
          const sc = STATUS_COLORS[statusLabel] ?? STATUS_COLORS.Visitor
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
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>{statusLabel}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.timeWrap}>
                <Text style={styles.time}>{tl.time}</Text>
                <Text style={[styles.day, { color: tl.day === "Today" ? colors.primary : colors.textMuted }]}>
                  {tl.day}
                </Text>
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
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
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

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: 10,
    ...shadowSoft,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },

  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
    paddingTop: 8,
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
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.canvasAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarText: { ...typography.caption, fontWeight: "800", color: colors.primaryDark },
  info: { flex: 1, minWidth: 0 },
  name: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  meta: { ...typography.caption, color: colors.textSecondary },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: radii.pill },
  badgeText: { fontSize: 10, fontWeight: "700" },
  timeWrap: { alignItems: "flex-end" },
  time: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },
  day: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { ...typography.body, color: colors.textSecondary },
})

export default RecentCheckInsScreen
