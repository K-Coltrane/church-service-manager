"use client"

import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useEffect, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { v4 as uuidv4 } from "uuid"
import AppButton from "../../components/ui/AppButton"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { apiService } from "../../services/api"
import { databaseService, type ServiceType } from "../../services/database"
import { colors, radii, shadowSoft, spacing, typography } from "../../theme/modernTheme"

type StartServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, "StartService">

interface Props {
  navigation: StartServiceScreenNavigationProp
}

const StartServiceScreen: React.FC<Props> = ({ navigation }) => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedServiceType, setSelectedServiceType] = useState<number>(0)
  const [speaker, setSpeaker] = useState("")
  const [expected, setExpected] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)

  useEffect(() => {
    loadServiceTypes()
  }, [])

  const iconForType = (typeName: string) => {
    const n = typeName.toLowerCase()
    if (n.includes("sunday") || n.includes("morning")) return "🌅"
    if (n.includes("evening") || n.includes("night")) return "🌙"
    if (n.includes("bible") || n.includes("study")) return "📖"
    if (n.includes("prayer")) return "🙏"
    if (n.includes("youth")) return "🎵"
    if (n.includes("special") || n.includes("program")) return "✨"
    return "⛪"
  }

  const loadServiceTypes = async () => {
    try {
      const defaultTypes = [
        { id: 1, name: "Sunday Morning Service" },
        { id: 2, name: "Midweek Service" },
        { id: 3, name: "Prayer Intense" },
        { id: 4, name: "Special Program" },
      ]

      let types = await databaseService.getServiceTypes()

      if (types.length === 0) {
        try {
          const remoteTypes = await apiService.getServiceTypes()
          if (remoteTypes.length > 0) {
            await databaseService.saveServiceTypes(remoteTypes)
            types = remoteTypes
          } else {
            await databaseService.saveServiceTypes(defaultTypes)
            types = defaultTypes
          }
        } catch {
          await databaseService.saveServiceTypes(defaultTypes)
          types = defaultTypes
        }
      }

      setServiceTypes(types)
    } catch (error) {
      console.error("Error loading service types:", error)
      Alert.alert("Error", "Failed to load service types")
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const handleStartService = async () => {
    if (!selectedServiceType) {
      Alert.alert("Error", "Please select a service type")
      return
    }

    setIsLoading(true)
    try {
      const selectedType = serviceTypes.find((t) => t.id === selectedServiceType)
      const expectedNumber = Number.parseInt(expected, 10)
      const expectedAttendance = Number.isFinite(expectedNumber) ? expectedNumber : undefined
      const notesParts = [
        speaker.trim() ? `Speaker: ${speaker.trim()}` : null,
        expectedAttendance !== undefined ? `Expected attendance: ${expectedAttendance}` : null,
      ].filter(Boolean) as string[]

      const serviceData = {
        local_id: uuidv4(),
        service_type_id: selectedServiceType,
        service_type_name: selectedType?.name,
        notes: notesParts.length ? notesParts.join("\n") : undefined,
        started_at: new Date().toISOString(),
        synced: false,
      }

      await databaseService.createService(serviceData)

      Alert.alert("Service Started", "Service has been started successfully!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("ActiveService", { serviceId: serviceData.local_id }),
        },
      ])
    } catch (error) {
      console.error("Error starting service:", error)
      Alert.alert("Error", "Failed to start service")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingTypes) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading service types...</Text>
      </SafeAreaView>
    )
  }

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Start Service</Text>
        <View style={styles.topRight} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Service Type</Text>
        <View style={styles.typeGrid}>
          {serviceTypes.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeCard, selectedServiceType === t.id && styles.typeCardSelected]}
              onPress={() => setSelectedServiceType(t.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.typeIcon}>{iconForType(t.name)}</Text>
              <Text style={[styles.typeName, selectedServiceType === t.id && styles.typeNameSelected]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Details</Text>

        <Text style={styles.inputLabel}>Date</Text>
        <View style={styles.dateField}>
          <Text style={styles.dateText}>{dateLabel}</Text>
        </View>

        <Text style={styles.inputLabel}>Lead Pastor / Speaker</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter name..."
          placeholderTextColor={colors.textMuted}
          value={speaker}
          onChangeText={setSpeaker}
        />

        <Text style={styles.inputLabel}>Expected Attendance</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 100"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={expected}
          onChangeText={setExpected}
        />

        <View style={styles.ctaWrap}>
          <AppButton title="Start Service →" onPress={handleStartService} loading={isLoading} disabled={isLoading} />
        </View>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.canvas,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  safe: { flex: 1, backgroundColor: colors.canvas },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
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

  scroll: { flex: 1, paddingHorizontal: spacing.md },
  sectionTitle: { ...typography.subtitle, marginTop: spacing.md, marginBottom: spacing.sm, color: colors.text },

  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: spacing.md },
  typeCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadowSoft,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.canvasAlt,
  },
  typeIcon: { fontSize: 26, marginBottom: 6 },
  typeName: { ...typography.caption, fontWeight: "700", color: colors.textSecondary, textAlign: "center" },
  typeNameSelected: { color: colors.primary },

  inputLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dateField: {
    backgroundColor: colors.canvasAlt,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  dateText: { ...typography.body, color: colors.primaryDark, fontWeight: "700" },
  ctaWrap: {
    marginTop: spacing.sm,
  },
})

export default StartServiceScreen
