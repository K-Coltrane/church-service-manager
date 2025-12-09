"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList, ActivityIndicator } from "react-native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { databaseService, type Visitor } from "../../services/database"
import { apiService } from "../../services/api"
import { v4 as uuidv4 } from "uuid"

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
      // Search local database first
      let results = await databaseService.searchVisitors(searchQuery.trim())

      // If no local results and we have internet, try remote search
      if (results.length === 0) {
        try {
          const remoteResults = await apiService.searchVisitors(searchQuery.trim())
          results = remoteResults
        } catch (error: any) {
          // Remote search failed (backend unavailable), continue with local results silently
          // Don't log network errors to reduce console noise
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
      <View style={styles.visitorInfo}>
        <Text style={styles.visitorName}>
          {item.first_name} {item.last_name}
        </Text>
        {item.phone && <Text style={styles.visitorPhone}>{item.phone}</Text>}
        {item.email && <Text style={styles.visitorEmail}>{item.email}</Text>}
      </View>
      <TouchableOpacity style={styles.checkInButton} onPress={() => handleCheckIn(item)}>
        <Text style={styles.checkInButtonText}>Check In</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <Text style={styles.title}>Search Existing Visitor</Text>

        <View style={styles.searchForm}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Enter name or phone number"
            autoCapitalize="words"
            onSubmitEditing={handleSearch}
          />

          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsSection}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : hasSearched ? (
          visitors.length > 0 ? (
            <FlatList
              data={visitors}
              renderItem={renderVisitorItem}
              keyExtractor={(item) => item.local_id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No visitors found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term or add a new visitor</Text>
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={() => navigation.navigate("AddVisitor", { serviceId })}
              >
                <Text style={styles.addNewButtonText}>Add New Visitor</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>Enter a name or phone number to search for existing visitors</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  searchSection: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
  },
  searchForm: {
    flexDirection: "row",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsSection: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  visitorItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  visitorPhone: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  visitorEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  checkInButton: {
    backgroundColor: "#10b981",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  checkInButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  addNewButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addNewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  instructionsText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
})

export default SearchVisitorScreen
