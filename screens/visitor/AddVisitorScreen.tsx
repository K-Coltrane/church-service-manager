"use client"

import type React from "react"
import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { databaseService } from "../../services/database"
import { v4 as uuidv4 } from "uuid"

type AddVisitorScreenNavigationProp = StackNavigationProp<RootStackParamList, "AddVisitor">
type AddVisitorScreenRouteProp = RouteProp<RootStackParamList, "AddVisitor">

interface Props {
  navigation: AddVisitorScreenNavigationProp
  route: AddVisitorScreenRouteProp
}

const AddVisitorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId } = route.params
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [inviterName, setInviterName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveAndCheckIn = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "First name and last name are required")
      return
    }

    setIsLoading(true)
    try {
      // Check for existing visitor
      const searchQuery = `${firstName.trim()} ${lastName.trim()}`
      const existingVisitors = await databaseService.searchVisitors(searchQuery)

      const exactMatch = existingVisitors.find(
        (v) =>
          v.first_name.toLowerCase() === firstName.trim().toLowerCase() &&
          v.last_name.toLowerCase() === lastName.trim().toLowerCase() &&
          v.phone === phone.trim(),
      )

      if (exactMatch) {
        Alert.alert(
          "Visitor Exists",
          "A visitor with this name and phone already exists. Would you like to check them in instead?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Check In",
              onPress: async () => {
                await checkInVisitor(exactMatch.local_id)
              },
            },
          ],
        )
        return
      }

      // Create new visitor
      const visitorData = {
        local_id: uuidv4(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        inviter_name: inviterName.trim() || undefined,
        synced: false,
        created_at: new Date().toISOString(),
      }

      await databaseService.createVisitor(visitorData)
      await checkInVisitor(visitorData.local_id)
    } catch (error) {
      console.error("Error saving visitor:", error)
      Alert.alert("Error", "Failed to save visitor")
    } finally {
      setIsLoading(false)
    }
  }

  const checkInVisitor = async (visitorLocalId: string) => {
    try {
      const attendanceData = {
        local_id: uuidv4(),
        service_local_id: serviceId,
        visitor_local_id: visitorLocalId,
        checked_in_at: new Date().toISOString(),
        synced: false,
      }

      await databaseService.createAttendance(attendanceData)

      Alert.alert("Success", "Visitor has been added and checked in successfully!", [
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Add New Visitor</Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Invited By</Text>
              <TextInput
                style={styles.input}
                value={inviterName}
                onChangeText={setInviterName}
                placeholder="Who invited this person?"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSaveAndCheckIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save & Check In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
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
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
})

export default AddVisitorScreen
