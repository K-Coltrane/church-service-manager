"use client"

import { Picker } from "@react-native-picker/picker"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useEffect, useState } from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { v4 as uuidv4 } from "uuid"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { apiService } from "../../services/api"
import { databaseService, type ServiceType } from "../../services/database"

type StartServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, "StartService">

interface Props {
  navigation: StartServiceScreenNavigationProp
}

const StartServiceScreen: React.FC<Props> = ({ navigation }) => {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  // 0 means "no selection" – used for the placeholder option in the picker
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
      // Default service types that should always be available
      const defaultTypes = [
        { id: 1, name: "Sunday Morning Service" },
        { id: 2, name: "Midweek Service" },
        { id: 3, name: "Prayer Intense" },
        { id: 4, name: "Special Program" },
      ]

      // Try to load from local database first
      let types = await databaseService.getServiceTypes()

      if (types.length === 0) {
        // If no local types, try to fetch from API
        try {
          const remoteTypes = await apiService.getServiceTypes()
          if (remoteTypes.length > 0) {
            await databaseService.saveServiceTypes(remoteTypes)
            types = remoteTypes
          } else {
            // If API returns empty, use defaults
            await databaseService.saveServiceTypes(defaultTypes)
            types = defaultTypes
          }
        } catch (error: any) {
          // If API fails (backend unavailable or network error), use default types
          await databaseService.saveServiceTypes(defaultTypes)
          types = defaultTypes
        }
      }

      setServiceTypes(types)
      // Leave selectedServiceType as 0 so the placeholder shows until user chooses
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
              <Picker
                selectedValue={selectedServiceType}
                onValueChange={(value) => setSelectedServiceType(value)}
                style={styles.picker}
                dropdownIconColor="#6366f1"
              >
                <Picker.Item label="Select service type..." value={0} color="#9ca3af" />
                {serviceTypes.map((type) => (
                  <Picker.Item 
                    key={type.id} 
                    label={type.name} 
                    value={type.id}
                    color="#1e293b"
                  />
                ))}
              </Picker>
            </View>
            {selectedServiceType !== 0 && (
              <Text style={styles.selectedServiceType}>
                Selected: {serviceTypes.find(t => t.id === selectedServiceType)?.name}
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Name of Service</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Take Over 1.0"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
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
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#1e293b",
  },
  selectedServiceType: {
    marginTop: 8,
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
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
