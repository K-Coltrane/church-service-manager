"use client"

import type { RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useCallback, useState } from "react"
import { ActivityIndicator, Alert, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { v4 as uuidv4 } from "uuid"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { apiService } from "../../services/api"
import { databaseService, type Visitor } from "../../services/database"
import { colors, radii, shadowSoft, spacing, typography } from "../../theme/modernTheme"

type SearchVisitorScreenNavigationProp = StackNavigationProp<RootStackParamList, "SearchVisitor">
type SearchVisitorScreenRouteProp = RouteProp<RootStackParamList, "SearchVisitor">

interface Props {
  navigation: SearchVisitorScreenNavigationProp
  route: SearchVisitorScreenRouteProp
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Member: { bg: "#d1fae5", text: "#065f46" },
  Visitor: { bg: "#dbeafe", text: "#1a6fd4" },
  "First-timer": { bg: "#fef3c7", text: "#92400e" },
  Worker: { bg: "#f3f4f6", text: "#374151" },
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

const SearchVisitorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId } = route.params
  const [query, setQuery] = useState("")
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [checkingInId, setCheckingInId] = useState<string | null>(null)

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setVisitors([])
      return
    }

    try {
      setIsSearching(true)
      let results = await databaseService.searchVisitors(trimmed)

      if (results.length === 0) {
        try {
          const remoteResults = await apiService.searchVisitors(trimmed)
          results = remoteResults
        } catch {
          // Remote search failed — keep local results
        }
      }

      setVisitors(results)
    } catch (error) {
      console.error("Search error:", error)
      Alert.alert("Error", "Failed to search visitors")
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleChange = (text: string) => {
    setQuery(text)
    search(text)
  }

  const handleCheckIn = async (visitor: Visitor) => {
    try {
      setCheckingInId(visitor.local_id)
      const attendanceData = {
        local_id: uuidv4(),
        service_local_id: serviceId,
        visitor_local_id: visitor.local_id,
        checked_in_at: new Date().toISOString(),
        synced: false,
      }

      await databaseService.createAttendance(attendanceData)

      navigation.goBack()
    } catch (error) {
      console.error("Error checking in visitor:", error)
      Alert.alert("Error", "Failed to check in visitor")
    } finally {
      setCheckingInId(null)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Check In Visitor</Text>
        <View style={styles.topRight} />
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleChange}
          autoFocus
          returnKeyType="search"
        />
        {isSearching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      <FlatList
        data={visitors}
        keyExtractor={(item) => item.local_id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={visitors.length > 0 ? <Text style={styles.sectionTitle}>Results ({visitors.length})</Text> : null}
        renderItem={({ item }) => {
          const name = `${item.first_name} ${item.last_name ?? ""}`.trim() || "—"
          const statusLabel = (item.status || "Visitor").split(",")[0]?.trim() || "Visitor"
          const sc = STATUS_COLORS[statusLabel] ?? STATUS_COLORS.Visitor
          return (
            <View style={styles.visitorCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(name)}</Text>
              </View>
              <View style={styles.visitorInfo}>
                <Text style={styles.visitorName}>{name}</Text>
                <Text style={styles.visitorMeta}>
                  {(item.phone || "—") + (item.location ? ` · ${item.location}` : "")}
                </Text>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.badgeText, { color: sc.text }]}>{statusLabel}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.checkInBtn}
                onPress={() => handleCheckIn(item)}
                activeOpacity={0.85}
                disabled={checkingInId === item.local_id}
              >
                {checkingInId === item.local_id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.checkInBtnText}>Check In</Text>
                )}
              </TouchableOpacity>
            </View>
          )
        }}
        ListEmptyComponent={
          query.trim().length >= 2 && !isSearching ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No visitors found</Text>
              <Text style={styles.emptySub}>Try a different search or register a new visitor</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("AddVisitor", { serviceId })} activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>+ Register New Visitor</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.hintWrap}>
              <Text style={styles.hintText}>Type at least 2 characters to search.</Text>
            </View>
          )
        }
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

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginBottom: spacing.sm },

  visitorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadowSoft,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radii.pill,
    backgroundColor: colors.canvasAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...typography.caption, fontWeight: "800", color: colors.primaryDark },
  visitorInfo: { flex: 1, minWidth: 0 },
  visitorName: { ...typography.subtitle, color: colors.text },
  visitorMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: 6 },
  badge: { alignSelf: "flex-start", paddingVertical: 3, paddingHorizontal: 10, borderRadius: radii.pill },
  badgeText: { fontSize: 11, fontWeight: "700" },

  checkInBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 82,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  hintWrap: { paddingTop: 40, alignItems: "center" },
  hintText: { ...typography.body, color: colors.textSecondary },

  emptyWrap: { alignItems: "center", paddingTop: 40, paddingHorizontal: 20 },
  emptyText: { ...typography.title, color: colors.text, marginBottom: 6 },
  emptySub: { ...typography.body, color: colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: spacing.md },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptyBtnText: { ...typography.subtitle, color: colors.primary },
})

export default SearchVisitorScreen
