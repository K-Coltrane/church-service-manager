"use client"

import type { RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import type { ReactNode } from "react"
import { useState } from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { v4 as uuidv4 } from "uuid"
import AppButton from "../../components/ui/AppButton"
import type { RootStackParamList } from "../../navigation/AppNavigator"
import { databaseService } from "../../services/database"
import { colors, radii, shadowSoft, spacing, typography } from "../../theme/modernTheme"

type AddVisitorScreenNavigationProp = StackNavigationProp<RootStackParamList, "AddVisitor">
type AddVisitorScreenRouteProp = RouteProp<RootStackParamList, "AddVisitor">

interface Props {
  navigation: AddVisitorScreenNavigationProp
  route: AddVisitorScreenRouteProp
}

type StatusOption = "Single" | "Married" | "Working Class" | "Student"

const AddVisitorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId } = route.params
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<StatusOption[]>([])
  const [level, setLevel] = useState("")
  const [inviterName, setInviterName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const toggleStatus = (option: StatusOption) => {
    setStatus((prev) => {
      if (prev.includes(option)) {
        return prev.filter((s) => s !== option)
      }
      return [...prev, option]
    })
  }

  const handleSaveAndCheckIn = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required")
      return
    }

    setIsLoading(true)
    try {
      const searchQuery = name.trim()
      const existingVisitors = await databaseService.searchVisitors(searchQuery)

      const exactMatch = existingVisitors.find(
        (v) =>
          v.first_name.toLowerCase() === name.trim().toLowerCase() &&
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

      const visitorData = {
        local_id: uuidv4(),
        first_name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        location: location.trim() || undefined,
        status: status.length > 0 ? status.join(",") : undefined,
        level: level.trim() || undefined,
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heroEyebrow}>Registration</Text>
        <Text style={styles.title}>Add new visitor</Text>

        <View style={styles.card}>
          <Field label="Name *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </Field>

          <Field label="Phone">
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </Field>

          <Field label="Location">
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Location"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </Field>

          <Field label="Email">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </Field>

          <Text style={styles.label}>Status</Text>
          <View style={styles.checkboxContainer}>
            {(["Single", "Married", "Working Class", "Student"] as StatusOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.checkboxRow}
                onPress={() => toggleStatus(option)}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <View style={[styles.checkbox, status.includes(option) && styles.checkboxChecked]}>
                  {status.includes(option) ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.checkboxLabel}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field label="Level">
            <TextInput
              style={styles.input}
              value={level}
              onChangeText={setLevel}
              placeholder="Level"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </Field>

          <Field label="Invited by">
            <TextInput
              style={styles.input}
              value={inviterName}
              onChangeText={setInviterName}
              placeholder="Who invited this person?"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </Field>

          <AppButton
            title="Save & check in"
            onPress={handleSaveAndCheckIn}
            loading={isLoading}
            disabled={isLoading}
            style={styles.cta}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
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
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadowSoft,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs,
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
  checkboxContainer: {
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text,
  },
  cta: {
    marginTop: spacing.md,
  },
})

export default AddVisitorScreen
