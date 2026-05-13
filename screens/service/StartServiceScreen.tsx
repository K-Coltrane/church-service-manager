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
import ScreenHeader from "../../components/ui/ScreenHeader"
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

  const initialForType = (typeName: string) => {
    const words = typeName.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
    return (words[0]?.[0] ?? "S").toUpperCase()
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
      <ScreenHeader title="Start Service" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Service Type</Text>
        <View style={styles.typeGrid}>
          {serviceTypes.map((t) => {
            const selected = selectedServiceType === t.id
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeCard, selected && styles.typeCardSelected]}
                onPress={() => setSelectedServiceType(t.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.typeInitial, selected && styles.typeInitialSelected]}>
                  <Text style={[styles.typeInitialText, selected && styles.typeInitialTextSelected]}>
                    {initialForType(t.name)}
                  </Text>
                </View>
                <Text style={[styles.typeName, selected && styles.typeNameSelected]}>{t.name}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.sectionLabel}>Details</Text>

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
          <AppButton title="Start Service" onPress={handleStartService} loading={isLoading} disabled={isLoading} />
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
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1, paddingHorizontal: spacing.lg },

  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

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
    backgroundColor: colors.primaryBg,
  },
  typeInitial: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  typeInitialSelected: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  typeInitialText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  typeInitialTextSelected: {
    color: "#fff",
  },
  typeName: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
  typeNameSelected: { color: colors.primaryDark },

  inputLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.md,
  },
  dateField: {
    backgroundColor: colors.primaryBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: spacing.md,
  },
  dateText: { ...typography.body, color: colors.primaryDark, fontWeight: "600" },
  ctaWrap: {
    marginTop: spacing.sm,
  },
})

export default StartServiceScreen
