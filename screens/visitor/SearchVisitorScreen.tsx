"use client"

import type { RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useState } from "react"
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native"
import { v4 as uuidv4 } from "uuid"
import AppButton from "../../components/ui/AppButton"
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

const SearchVisitorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId } = route.params
  const [searchQuery, setSearchQuery] = useState("")
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a name or phone number to search")
      return
    }

    setIsSearching(true)
    setHasSearched(true)

    try {
      let results = await databaseService.searchVisitors(searchQuery.trim())

      if (results.length === 0) {
        try {
          const remoteResults = await apiService.searchVisitors(searchQuery.trim())
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
  }

  const handleCheckIn = async (visitor: Visitor) => {
    try {
      const attendanceData = {
        local_id: uuidv4(),
        service_local_id: serviceId,
        visitor_local_id: visitor.local_id,
        checked_in_at: new Date().toISOString(),
        synced: false,
      }

      await databaseService.createAttendance(attendanceData)

      Alert.alert("Success", `${visitor.first_name} ${visitor.last_name} has been checked in!`, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error("Error checking in visitor:", error)
      Alert.alert("Error", "Failed to check in visitor")
    }
  }

  const renderVisitorItem = ({ item }: { item: Visitor }) => (
    <View style={styles.visitorItem}>
      <View style={styles.visitorAccent} />
      <View style={styles.visitorBody}>
        <View style={styles.visitorInfo}>
          <Text style={styles.visitorName}>
            {item.first_name} {item.last_name}
          </Text>
          {item.phone ? <Text style={styles.visitorPhone}>{item.phone}</Text> : null}
          {item.email ? <Text style={styles.visitorEmail}>{item.email}</Text> : null}
        </View>
        <AppButton title="Check in" onPress={() => handleCheckIn(item)} variant="success" style={styles.checkInBtn} />
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Text style={styles.heroEyebrow}>Lookup</Text>
        <Text style={styles.title}>Find a visitor</Text>
        <View style={styles.searchForm}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Name or phone"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            onSubmitEditing={handleSearch}
          />
          <AppButton
            title="Search"
            onPress={handleSearch}
            loading={isSearching}
            disabled={isSearching}
            style={styles.searchBtn}
          />
        </View>
      </View>

      <View style={styles.resultsSection}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : hasSearched ? (
          visitors.length > 0 ? (
            <FlatList
              data={visitors}
              renderItem={renderVisitorItem}
              keyExtractor={(item) => item.local_id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No visitors found</Text>
              <Text style={styles.noResultsSubtext}>Try another term or add someone new.</Text>
              <AppButton title="Add new visitor" onPress={() => navigation.navigate("AddVisitor", { serviceId })} />
            </View>
          )
        ) : (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>Search by name or phone to check in an existing visitor.</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  searchSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadowSoft,
  },
  heroEyebrow: {
    ...typography.small,
    color: colors.cyan,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  searchForm: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "stretch",
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    minHeight: 52,
  },
  searchBtn: {
    minWidth: 108,
    paddingHorizontal: 16,
  },
  resultsSection: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  visitorItem: {
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...shadowSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  visitorAccent: {
    height: 3,
    backgroundColor: colors.mint,
  },
  visitorBody: {
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  visitorInfo: {
    flex: 1,
    minWidth: 0,
  },
  visitorName: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: 4,
  },
  visitorPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  visitorEmail: {
    ...typography.caption,
    color: colors.textMuted,
  },
  checkInBtn: {
    flexShrink: 0,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  noResultsText: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  noResultsSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  instructionsText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
})

export default SearchVisitorScreen
