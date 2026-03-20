"use client"

import { Picker } from "@react-native-picker/picker"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
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
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)

  useEffect(() => {
    loadServiceTypes()
  }, [])

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
      const serviceData = {
        local_id: uuidv4(),
        service_type_id: selectedServiceType,
        service_type_name: selectedType?.name,
        name: name.trim() || undefined,
        notes: notes.trim() || undefined,
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading service types...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>New session</Text>
        <Text style={styles.title}>Start a service</Text>
        <Text style={styles.heroSub}>Pick a type, add optional details, and go live.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Service type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedServiceType}
            onValueChange={(value) => setSelectedServiceType(value)}
            style={styles.picker}
            dropdownIconColor={colors.primary}
          >
            <Picker.Item label="Select service type..." value={0} color={colors.textMuted} />
            {serviceTypes.map((type) => (
              <Picker.Item key={type.id} label={type.name} value={type.id} color={colors.text} />
            ))}
          </Picker>
        </View>
        {selectedServiceType !== 0 && (
          <Text style={styles.selectedHint}>
            Selected: {serviceTypes.find((t) => t.id === selectedServiceType)?.name}
          </Text>
        )}

        <Text style={[styles.label, styles.labelSpaced]}>Name of service</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Take Over 1.0"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={[styles.label, styles.labelSpaced]}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <AppButton
          title="Start service"
          onPress={handleStartService}
          loading={isLoading}
          disabled={isLoading}
          style={styles.cta}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
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
  hero: {
    marginBottom: spacing.lg,
  },
  heroEyebrow: {
    ...typography.small,
    color: colors.cyan,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  heroSub: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadowSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  label: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  labelSpaced: {
    marginTop: spacing.md,
  },
  pickerContainer: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  picker: {
    height: 52,
    color: colors.text,
  },
  selectedHint: {
    marginTop: spacing.sm,
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  cta: {
    marginTop: spacing.lg,
  },
})

export default StartServiceScreen
