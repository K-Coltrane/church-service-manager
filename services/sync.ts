import NetInfo from "@react-native-community/netinfo"
import { apiService } from "./api"
import { databaseService } from "./database"

export type SyncStatus = "synced" | "pending" | "error" | "syncing"

const normalizeVisitorName = (firstName: string, lastName?: string) => {
  const trimmedFirst = (firstName || "").trim()
  const trimmedLast = (lastName || "").trim()

  if (trimmedLast) {
    return { firstName: trimmedFirst || trimmedLast, lastName: trimmedLast }
  }

  if (!trimmedFirst) {
    return { firstName: "Unknown", lastName: "Unknown" }
  }

  const parts = trimmedFirst.split(/\s+/)
  if (parts.length === 1) {
    return { firstName: trimmedFirst, lastName: "Unknown" }
  }

  const [first, ...rest] = parts
  const derivedLast = rest.join(" ").trim()

  return { firstName: first, lastName: derivedLast || "Unknown" }
}

class SyncService {
  private syncInProgress = false
  private listeners: Array<(status: SyncStatus) => void> = []

  addStatusListener(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener)
  }

  removeStatusListener(listener: (status: SyncStatus) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener)
  }

  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach((listener) => listener(status))
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const [services, visitors, attendance] = await Promise.all([
        databaseService.getUnsyncedServices(),
        databaseService.getUnsyncedVisitors(),
        databaseService.getUnsyncedAttendance(),
      ])

      const hasUnsynced = services.length > 0 || visitors.length > 0 || attendance.length > 0

      if (this.syncInProgress) {
        return "syncing"
      }

      return hasUnsynced ? "pending" : "synced"
    } catch (error) {
      return "error"
    }
  }

  async syncAll(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Sync already in progress, skipping...")
      return
    }

    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) {
      throw new Error("No internet connection")
    }

    this.syncInProgress = true
    this.notifyListeners("syncing")

    console.log("🔄 Starting sync to Supabase...")

    try {
      // Sync in order: services -> visitors -> attendance
      // This order is critical because attendance depends on both service and visitor
      await this.syncServices()
      await this.syncVisitors()
      await this.syncAttendance()

      console.log("✅ Sync to Supabase completed successfully")
      this.notifyListeners("synced")
    } catch (error: any) {
      console.error("❌ Sync error:", error.message || error)
      this.notifyListeners("error")
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncServices(): Promise<void> {
    const services = await databaseService.getUnsyncedServices()

    if (services.length === 0) {
      return
    }

    console.log(`Syncing ${services.length} service(s) to Supabase...`)

    for (const service of services) {
      try {
        // Sync to Supabase (via apiService which tries Supabase first)
        const response = await apiService.syncService({
          service_type_id: service.service_type_id,
          location: service.location,
          notes: service.notes,
          started_at: service.started_at,
          ended_at: service.ended_at,
        })

        // Update local record with Supabase ID (remote_id)
        if (response.id) {
          await databaseService.markServiceSynced(service.local_id, response.id)
          console.log(`✓ Service synced: ${service.local_id} → Supabase ID: ${response.id}`)
        } else {
          throw new Error("No ID returned from Supabase")
        }
      } catch (error: any) {
        // Only log if it's not a network/backend unavailable error
        if (error.message !== "Backend not configured" && error.message !== "Backend unavailable") {
          console.warn(`✗ Error syncing service ${service.local_id}:`, error.message || "Unknown error")
        }
        // Continue with other services - don't stop sync on single failure
      }
    }
  }

  private async syncVisitors(): Promise<void> {
    const visitors = await databaseService.getUnsyncedVisitors()

    if (visitors.length === 0) {
      return
    }

    console.log(`Syncing ${visitors.length} visitor(s) to Supabase...`)

    for (const visitor of visitors) {
      try {
        const normalizedName = normalizeVisitorName(visitor.first_name, visitor.last_name)

        // Sync to Supabase (via apiService which tries Supabase first)
        const response = await apiService.syncVisitor({
          first_name: normalizedName.firstName,
          last_name: normalizedName.lastName,
          phone: visitor.phone,
          email: visitor.email,
          inviter_name: visitor.inviter_name,
        })

        // Update local record with Supabase ID (remote_id)
        if (response.id) {
          await databaseService.markVisitorSynced(visitor.local_id, response.id)
          console.log(`✓ Visitor synced: ${visitor.local_id} → Supabase ID: ${response.id}`)
        } else {
          throw new Error("No ID returned from Supabase")
        }
      } catch (error: any) {
        // Only log if it's not a network/backend unavailable error
        if (error.message !== "Backend not configured" && error.message !== "Backend unavailable") {
          console.warn(`✗ Error syncing visitor ${visitor.local_id}:`, error.message || "Unknown error")
        }
        // Continue with other visitors - don't stop sync on single failure
      }
    }
  }

  private async syncAttendance(): Promise<void> {
    const attendance = await databaseService.getUnsyncedAttendance()

    if (attendance.length === 0) {
      return
    }

    console.log(`Syncing ${attendance.length} attendance record(s) to Supabase...`)

    for (const record of attendance) {
      try {
        // Look up remote IDs (Supabase IDs) for service and visitor
        const service = await databaseService.getServiceByLocalId(record.service_local_id)
        const visitor = await databaseService.getVisitorByLocalId(record.visitor_local_id)

        // Skip if service or visitor hasn't been synced to Supabase yet (no remote_id)
        if (!service?.remote_id || !visitor?.remote_id) {
          console.log(
            `⏭ Skipping attendance sync - dependencies not synced. Service ID: ${service?.remote_id || "missing"}, Visitor ID: ${visitor?.remote_id || "missing"}`,
          )
          continue
        }

        // Sync to Supabase (via apiService which tries Supabase first)
        const response = await apiService.syncAttendance({
          service_id: service.remote_id, // Use Supabase service ID
          visitor_id: visitor.remote_id, // Use Supabase visitor ID
          checked_in_at: record.checked_in_at,
        })

        // Update local record with Supabase ID (remote_id)
        if (response.id && typeof response.id === "number") {
          await databaseService.markAttendanceSynced(record.local_id, response.id)
          console.log(`✓ Attendance synced: ${record.local_id} → Supabase ID: ${response.id}`)
        } else if (response.success) {
          // If Supabase returns success but no id (shouldn't happen)
          console.warn("Attendance synced but no ID returned from Supabase")
          await databaseService.markAttendanceSynced(record.local_id, 0)
        } else {
          throw new Error("Invalid response from Supabase")
        }
      } catch (error: any) {
        // Only log if it's not a network/backend unavailable error
        if (error.message !== "Backend not configured" && error.message !== "Backend unavailable") {
          if (error.response) {
            console.warn(`✗ Attendance sync error (${record.local_id}):`, error.response.status)
          } else {
            console.warn(`✗ Attendance sync error (${record.local_id}):`, error.message || "Unknown error")
          }
        }
        // Continue with other records - don't stop sync on single failure
      }
    }
  }

  // Auto-sync when network returns
  startAutoSync() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.syncInProgress) {
        this.syncAll().catch((error: any) => {
          // Only log if it's not a backend unavailable error
          if (error.message !== "Backend not configured" && error.message !== "Backend unavailable" && error.message !== "No internet connection") {
            console.warn("Auto-sync error:", error.message || "Unknown error")
          }
        })
      }
    })
  }
}

export const syncService = new SyncService()
