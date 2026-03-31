"use client"

import type { RouteProp } from "@react-navigation/native"
import type { StackNavigationProp } from "@react-navigation/stack"
import type React from "react"
import { useState } from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
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
import { databaseService } from "../../services/database"
import { colors, radii, shadowSoft, spacing, typography } from "../../theme/modernTheme"

type AddVisitorScreenNavigationProp = StackNavigationProp<RootStackParamList, "AddVisitor">
type AddVisitorScreenRouteProp = RouteProp<RootStackParamList, "AddVisitor">

interface Props {
  navigation: AddVisitorScreenNavigationProp
  route: AddVisitorScreenRouteProp
}

const STATUS_OPTIONS = ["First-timer", "Visitor", "Member", "Worker", "Youth", "Child"] as const
type StatusOption = (typeof STATUS_OPTIONS)[number]

function splitFullName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { firstName: parts[0] || "" }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") }
}

const AddVisitorScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceId } = route.params
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [email, setEmail] = useState("")
  const [statuses, setStatuses] = useState<StatusOption[]>(["First-timer"])
  const [level, setLevel] = useState("")
  const [inviterName, setInviterName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const toggleStatus = (s: StatusOption) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  const checkInVisitor = async (visitorLocalId: string) => {
    await databaseService.createAttendance({
      local_id: uuidv4(),
      service_local_id: serviceId,
      visitor_local_id: visitorLocalId,
      checked_in_at: new Date().toISOString(),
      synced: false,
    })
  }

  const handleSubmit = async (checkIn: boolean) => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter the visitor's name.")
      return
    }

    setIsLoading(true)
    try {
      const { firstName, lastName } = splitFullName(name)
      const phoneTrimmed = phone.trim()

      const existing = await databaseService.searchVisitors(name.trim())
      const dup = existing.find((v) => {
        const sameName =
          v.first_name.trim().toLowerCase() === firstName.trim().toLowerCase() &&
          (v.last_name || "").trim().toLowerCase() === (lastName || "").trim().toLowerCase()
        const samePhone = (v.phone || "").trim() === phoneTrimmed
        return sameName && (phoneTrimmed ? samePhone : true)
      })

      if (dup) {
        Alert.alert("Visitor Exists", "This visitor already exists. Would you like to check them in instead?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Check In",
            onPress: async () => {
              await checkInVisitor(dup.local_id)
              navigation.goBack()
            },
          },
        ])
        return
      }

      const visitorLocalId = uuidv4()
      await databaseService.createVisitor({
        local_id: visitorLocalId,
        first_name: firstName.trim(),
        last_name: lastName?.trim() || undefined,
        phone: phoneTrimmed || undefined,
        email: email.trim() || undefined,
        location: location.trim() || undefined,
        status: statuses.length ? statuses.join(",") : undefined,
        level: level.trim() || undefined,
        inviter_name: inviterName.trim() || undefined,
        synced: false,
        created_at: new Date().toISOString(),
      })

      if (checkIn) {
        await checkInVisitor(visitorLocalId)
      }

      navigation.goBack()
    } catch (error) {
      console.error("Error saving visitor:", error)
      Alert.alert("Error", "Could not save visitor. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Add Visitor</Text>
        <View style={styles.topRight} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Abena Boateng"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+233 ..."
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="City / Area"
            placeholderTextColor={colors.textMuted}
            value={location}
            onChangeText={setLocation}
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Status</Text>
          <View style={styles.tagRow}>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.tag, statuses.includes(s) && styles.tagSelected]}
                onPress={() => toggleStatus(s)}
                activeOpacity={0.85}
                disabled={isLoading}
              >
                <Text style={[styles.tagText, statuses.includes(s) && styles.tagTextSelected]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Level</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. New Convert, Established..."
            placeholderTextColor={colors.textMuted}
            value={level}
            onChangeText={setLevel}
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Invited By</Text>
          <TextInput
            style={styles.input}
            placeholder="Member's name..."
            placeholderTextColor={colors.textMuted}
            value={inviterName}
            onChangeText={setInviterName}
            editable={!isLoading}
          />

          <View style={styles.ctaWrap}>
            <AppButton title="Register & Check In →" onPress={() => handleSubmit(true)} loading={isLoading} disabled={isLoading} />
            <AppButton title="Save Without Checking In" variant="outline" onPress={() => handleSubmit(false)} disabled={isLoading} style={styles.secondaryCta} />
          </View>
          <View style={{ height: spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
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

  scroll: { flex: 1, paddingHorizontal: spacing.md },
  inputLabel: { ...typography.small, color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 13,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
    ...shadowSoft,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tag: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tagSelected: { borderColor: colors.primary, backgroundColor: colors.canvasAlt },
  tagText: { ...typography.caption, fontWeight: "700", color: colors.textSecondary },
  tagTextSelected: { color: colors.primary },
  ctaWrap: { marginTop: 8, gap: spacing.sm },
  secondaryCta: { marginTop: 0 },
})

export default AddVisitorScreen
