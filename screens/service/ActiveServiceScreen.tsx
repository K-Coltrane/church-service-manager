"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, RefreshControl, FlatList } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { databaseService, type Service, type Attendance, type Visitor } from "../../services/database"

type ActiveServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, "ActiveService">
type ActiveServiceScreenRouteProp = RouteProp<RootStackParamList, "ActiveService">

interface Props {
  navigation: ActiveServiceScreenNavigationProp
  route: ActiveServiceScreenRouteProp
}

const ActiveServiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId } = route.params
  const [service, setService] = useState<Service | null>(null)
  const [attendance, setAttendance] = useState<Array<Attendance & { visitor: Visitor }>>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadServiceData = async () => {
    try {
      const serviceData = await databaseService.getActiveService()
      if (serviceData && serviceData.local_id === serviceId) {
        setService(serviceData)
      }

      const attendanceData = await databaseService.getServiceAttendance(serviceId)
      setAttendance(attendanceData)
    } catch (error) {
      console.error("Error loading service data:", error)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadServiceData()
    }, [serviceId]),
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await loadServiceData()
    setRefreshing(false)
  }

  const handleEndService = () => {
    Alert.alert("End Service", "Are you sure you want to end this service? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Service",
        style: "destructive",
        onPress: async () => {
          try {
            await databaseService.endService(serviceId, new Date().toISOString())
            Alert.alert("Service Ended", "Service has been ended successfully!", [
              { text: "OK", onPress: () => navigation.navigate("Home") },
            ])
          } catch (error) {
            console.error("Error ending service:", error)
            Alert.alert("Error", "Failed to end service")
          }
        },
      },
    ])
  }

  const renderAttendeeItem = ({ item }: { item: Attendance & { visitor: Visitor } }) => (
    <View style={styles.attendeeItem}>
      <View style={styles.attendeeInfo}>
        <Text style={styles.attendeeName}>
          {item.visitor.first_name} {item.visitor.last_name}
        </Text>
        {item.visitor.phone && <Text style={styles.attendeePhone}>{item.visitor.phone}</Text>}
      </View>
      <Text style={styles.checkInTime}>{new Date(item.checked_in_at).toLocaleTimeString()}</Text>
    </View>
  )

  if (!service) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading service...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceType}>{service.service_type_name}</Text>
          {service.location && <Text style={styles.serviceLocation}>{service.location}</Text>}
          <Text style={styles.serviceTime}>Started: {new Date(service.started_at).toLocaleString()}</Text>
          {service.notes && <Text style={styles.serviceNotes}>{service.notes}</Text>}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{attendance.length}</Text>
            <Text style={styles.statLabel}>Total Check-ins</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("AddVisitor", { serviceId })}
          >
            <Text style={styles.primaryButtonText}>Add New Visitor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("SearchVisitor", { serviceId })}
          >
            <Text style={styles.secondaryButtonText}>Check In Existing Visitor</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.attendeesList}>
          <Text style={styles.sectionTitle}>Recent Check-ins</Text>
          {attendance.length > 0 ? (
            <FlatList
              data={attendance}
              renderItem={renderAttendeeItem}
              keyExtractor={(item) => item.local_id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noAttendeesText}>No check-ins yet</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.endServiceButton} onPress={handleEndService}>
          <Text style={styles.endServiceButtonText}>End Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
  scrollView: {
    flex: 1,
  },
  serviceInfo: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  serviceType: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  serviceLocation: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 4,
  },
  serviceTime: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
  },
  serviceNotes: {
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
  },
  stats: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#6366f1",
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: "600",
  },
  attendeesList: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  attendeeItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  attendeePhone: {
    fontSize: 14,
    color: "#64748b",
  },
  checkInTime: {
    fontSize: 12,
    color: "#64748b",
  },
  noAttendeesText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 16,
    marginTop: 20,
  },
  bottomActions: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  endServiceButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  endServiceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ActiveServiceScreen
