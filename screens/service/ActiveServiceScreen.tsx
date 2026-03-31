"use client"

import type { RouteProp } from "@react-navigation/native"
import { useFocusEffect } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useCallback, useState } from "react"
import { Alert, FlatList, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

const ActiveServiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId } = route.params
  const [service, setService] = useState<Service | null>(null)
  const [attendance, setAttendance] = useState<Array<Attendance & { visitor: Visitor }>>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
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
      load()
    }, [serviceId]),
  )

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const handleEndService = () => {
    Alert.alert("End Service", "Are you sure you want to end this service?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Service",
        style: "destructive",
        onPress: async () => {
          try {
            await databaseService.endService(serviceId, new Date().toISOString())
            navigation.replace("Home")
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
      <SafeAreaView style={styles.loading}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.loadingText}>Loading service...</Text>
      </SafeAreaView>
    )
  }

  const newVisitors = 0

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Active Service</Text>
        <View style={styles.topRight} />
      </View>

      <FlatList
        data={attendance}
        keyExtractor={(item) => item.local_id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.serviceCard}>
              <Text style={styles.serviceType}>{service.service_type_name || "Service"}</Text>
              <Text style={styles.serviceCount}>{attendance.length} Checked In</Text>
              <View style={styles.serviceStats}>
                <View>
                  <Text style={styles.serviceStatNum}>{newVisitors}</Text>
                  <Text style={styles.serviceStatLbl}>New visitors</Text>
                </View>
                <View>
                  <Text style={styles.serviceStatNum}>{Math.max(0, attendance.length - newVisitors)}</Text>
                  <Text style={styles.serviceStatLbl}>Returning</Text>
                </View>
              </View>
            </View>

            <AppButton title="+ Add New Visitor" onPress={() => navigation.navigate("AddVisitor", { serviceId })} />
            <AppButton
              title="Search & Check In"
              variant="secondary"
              onPress={() => navigation.navigate("SearchVisitor", { serviceId })}
              style={styles.secondaryBtn}
            />
            <Text style={styles.sectionTitle}>Attendance ({attendance.length})</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const fullName = `${item.visitor.first_name} ${item.visitor.last_name ?? ""}`.trim() || "—"
          const time = item.checked_in_at
            ? new Date(item.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : ""

          return (
            <View style={styles.attendeeRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(fullName)}</Text>
              </View>
              <View style={styles.attendeeInfo}>
                <Text style={styles.attendeeName}>{fullName}</Text>
                <Text style={styles.attendeeMeta}>
                  {(item.visitor.phone || "Checked in") + (time ? ` · ${time}` : "")}
                </Text>
              </View>
              <View style={styles.checkBadge}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
            </View>
          )
        }}
        ListFooterComponent={() => (
          <View style={styles.footer}>
            <AppButton title="End Service" variant="danger" onPress={handleEndService} />
            <View style={{ height: spacing.lg }} />
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  loading: { flex: 1, backgroundColor: colors.canvas, alignItems: "center", justifyContent: "center" },
  loadingText: { ...typography.body, color: colors.textSecondary },

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

  header: { paddingHorizontal: spacing.md },
  serviceCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadowCard,
  },
  serviceType: { ...typography.small, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: 0.7 },
  serviceCount: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 4, marginBottom: spacing.md },
  serviceStats: { flexDirection: "row", gap: 22 },
  serviceStatNum: { fontSize: 20, fontWeight: "800", color: "#fff" },
  serviceStatLbl: { ...typography.caption, color: "rgba(255,255,255,0.72)" },

  secondaryBtn: { marginTop: spacing.sm },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },

  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
    marginRight: 12,
  },
  avatarText: { ...typography.caption, fontWeight: "800", color: colors.primaryDark },
  attendeeInfo: { flex: 1, minWidth: 0 },
  attendeeName: { ...typography.subtitle, color: colors.text },
  attendeeMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.mintSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  checkIcon: { fontSize: 12, color: colors.mint, fontWeight: "900" },

  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
})

export default ActiveServiceScreen
