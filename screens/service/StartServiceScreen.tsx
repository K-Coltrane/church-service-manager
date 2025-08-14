"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from "react-native"
import { Picker } from "@react-native-picker/picker"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { databaseService, type ServiceType } from "../../services/database"
import { apiService } from "../../services/api"
import { v4 as uuidv4 } from "uuid"

type StartServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, "StartService">

interface Props {
  navigation: StartServiceScreenNavigationProp
}

const StartServiceScreen: React.FC<Props> = ({ navigation }) => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [selectedServiceType, setSelectedServiceType] = useState<number | null>(null)
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)

  useEffect(() => {
    loadServiceTypes()
  }, [])

  const loadServiceTypes = async () => {
    try {
      // Try to load from local database first
      let types = await databaseService.getServiceTypes()

      if (types.length === 0) {
        // If no local types, try to fetch from API
        try {
          const remoteTypes = await apiService.getServiceTypes()
          await databaseService.saveServiceTypes(remoteTypes)
          types = remoteTypes
        } catch (error) {
          // If API fails, use default types
          const defaultTypes = [
            { id: 1, name: "Sunday Morning Service" },
            { id: 2, name: "Sunday Evening Service" },
            { id: 3, name: "Wednesday Prayer Meeting" },
            { id: 4, name: "Special Event" },
          ]
          await databaseService.saveServiceTypes(defaultTypes)
          types = defaultTypes
        }
      }

      setServiceTypes(types)
      if (types.length > 0) {
        setSelectedServiceType(types[0].id)
      }
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
        location: location.trim() || undefined,
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
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading service types...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Start New Service</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Service Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={selectedServiceType} onValueChange={setSelectedServiceType} style={styles.picker}>
                {serviceTypes.map((type) => (
                  <Picker.Item key={type.id} label={type.name} value={type.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location (Optional)</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Main Sanctuary, Fellowship Hall"
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this service"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.startButton, isLoading && styles.startButtonDisabled]}
            onPress={handleStartService}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.startButtonText}>Start Service</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  startButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
})

export default StartServiceScreen
