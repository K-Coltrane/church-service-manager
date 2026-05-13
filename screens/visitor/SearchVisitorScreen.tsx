"use client"

import type { RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useCallback, useState } from "react"
import { ActivityIndicator, Alert, FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { v4 as uuidv4 } from "uuid"
import ScreenHeader from "../../components/ui/ScreenHeader"
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
      <ScreenHeader title="Check In Visitor" onBack={() => navigation.goBack()} />

      <View style={styles.searchRow}>
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
        ListHeaderComponent={visitors.length > 0 ? <Text style={styles.sectionLabel}>Results ({visitors.length})</Text> : null}
        renderItem={({ item }) => {
          const name = `${item.first_name} ${item.last_name ?? ""}`.trim() || "—"
          const statusLabel = (item.status || "Visitor").split(",")[0]?.trim() || "Visitor"
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
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{statusLabel}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.checkInBtn}
                onPress={() => handleCheckIn(item)}
                activeOpacity={0.8}
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
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate("AddVisitor", { serviceId })}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Register New Visitor</Text>
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

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: 10,
    ...shadowSoft,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },

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
    borderRadius: 21,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "700", color: colors.primaryDark },
  visitorInfo: { flex: 1, minWidth: 0 },
  visitorName: { ...typography.h4, color: colors.text },
  visitorMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2, marginBottom: 6 },
  badge: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: colors.primaryDark },

  checkInBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 82,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  hintWrap: { paddingTop: 40, alignItems: "center" },
  hintText: { ...typography.bodySmall, color: colors.textSecondary },

  emptyWrap: { alignItems: "center", paddingTop: 40, paddingHorizontal: 20 },
  emptyText: { ...typography.h3, color: colors.text, marginBottom: 6 },
  emptySub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  emptyBtnText: { ...typography.h4, color: colors.primary },
})

export default SearchVisitorScreen
