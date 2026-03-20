"use client"

import type { RouteProp } from "@react-navigation/native"
import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useCallback, useState } from "react"
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import AppButton from "../../components/ui/AppButton"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { databaseService, type Attendance, type Service, type Visitor } from "../../services/database"
import { colors, radii, shadowCard, shadowSoft, spacing, typography } from "../../theme/modernTheme"

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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator
      >
        <View style={styles.serviceCard}>
          <View style={styles.cardAccent} />
          <Text style={styles.serviceType}>{service.service_type_name}</Text>
          {service.location ? <Text style={styles.serviceMeta}>{service.location}</Text> : null}
          <Text style={styles.serviceMeta}>Started {new Date(service.started_at).toLocaleString()}</Text>
          {service.notes ? <Text style={styles.serviceNotes}>{service.notes}</Text> : null}
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{attendance.length}</Text>
          <Text style={styles.statLabel}>Check-ins this service</Text>
        </View>

        <View style={styles.actions}>
          <AppButton title="Add new visitor" onPress={() => navigation.navigate("AddVisitor", { serviceId })} />
          <AppButton
            title="Check in existing visitor"
            onPress={() => navigation.navigate("SearchVisitor", { serviceId })}
            variant="outline"
          />
        </View>

        <Text style={styles.sectionTitle}>Recent check-ins</Text>
        {attendance.length > 0 ? (
          attendance.map((item) => (
            <View key={item.local_id} style={styles.attendeeItem}>
              <View style={styles.attendeeDot} />
              <View style={styles.attendeeInfo}>
                <Text style={styles.attendeeName}>
                  {item.visitor.first_name} {item.visitor.last_name}
                </Text>
                {item.visitor.phone ? <Text style={styles.attendeePhone}>{item.visitor.phone}</Text> : null}
              </View>
              <Text style={styles.checkInTime}>{new Date(item.checked_in_at).toLocaleTimeString()}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>No check-ins yet — add or search for a visitor.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.endServiceButton} onPress={handleEndService} activeOpacity={0.9}>
          <Text style={styles.endServiceButtonText}>End service</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.canvas,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadowCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  serviceType: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  serviceMeta: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  serviceNotes: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  statCard: {
    backgroundColor: colors.cyanSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "#a5f3fc",
  },
  statNumber: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.primaryDark,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },
  actions: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  attendeeItem: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    ...shadowSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  attendeeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mint,
    marginRight: spacing.sm,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    ...typography.subtitle,
    color: colors.text,
  },
  attendeePhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkInTime: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: "600",
  },
  emptyHint: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyHintText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  bottomActions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadowSoft,
  },
  endServiceButton: {
    backgroundColor: colors.error,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  endServiceButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
})

export default ActiveServiceScreen
