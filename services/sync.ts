import NetInfo from "@react-native-community/netinfo"
import { apiService } from "./api"
import { databaseService } from "./database"

export type SyncStatus = "synced" | "pending" | "error" | "syncing"

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
      return
    }

    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) {
      throw new Error("No internet connection")
    }

    this.syncInProgress = true
    this.notifyListeners("syncing")

    try {
      // Sync in order: services -> visitors -> attendance
      await this.syncServices()
      await this.syncVisitors()
      await this.syncAttendance()

      this.notifyListeners("synced")
    } catch (error) {
      console.error("Sync error:", error)
      this.notifyListeners("error")
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncServices(): Promise<void> {
    const services = await databaseService.getUnsyncedServices()

    for (const service of services) {
      try {
        const response = await apiService.syncService({
          service_type_id: service.service_type_id,
          location: service.location,
          notes: service.notes,
          started_at: service.started_at,
          ended_at: service.ended_at,
        })

        await databaseService.markServiceSynced(service.local_id, response.id)
      } catch (error) {
        console.error("Error syncing service:", error)
        // Continue with other services
      }
    }
  }

  private async syncVisitors(): Promise<void> {
    const visitors = await databaseService.getUnsyncedVisitors()

    for (const visitor of visitors) {
      try {
        const response = await apiService.syncVisitor({
          first_name: visitor.first_name,
          last_name: visitor.last_name,
          phone: visitor.phone,
          email: visitor.email,
          inviter_name: visitor.inviter_name,
        })

        await databaseService.markVisitorSynced(visitor.local_id, response.id)
      } catch (error) {
        console.error("Error syncing visitor:", error)
        // Continue with other visitors
      }
    }
  }

  private async syncAttendance(): Promise<void> {
    const attendance = await databaseService.getUnsyncedAttendance()

    for (const record of attendance) {
      try {
        const response = await apiService.syncAttendance({
          service_local_id: record.service_local_id,
          visitor_local_id: record.visitor_local_id,
          checked_in_at: record.checked_in_at,
        })

        await databaseService.markAttendanceSynced(record.local_id, response.id)
      } catch (error) {
        console.error("Error syncing attendance:", error)
        // Continue with other records
      }
    }
  }

  // Auto-sync when network returns
  startAutoSync() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.syncInProgress) {
        this.syncAll().catch(console.error)
      }
    })
  }
}

export const syncService = new SyncService()
