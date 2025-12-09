import * as SQLite from "expo-sqlite"

let db: SQLite.SQLiteDatabase | null = null

const initializeDatabase = () => {
  try {
    if (!db) {
      db = SQLite.openDatabaseSync("church_service.db")
      console.log("Database initialized successfully")
    }
    return db
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}

export interface Service {
  id?: number
  local_id: string
  service_type_id: number
  service_type_name?: string
  location?: string
  notes?: string
  started_at: string
  ended_at?: string
  synced: boolean
  remote_id?: number
}

export interface Visitor {
  id?: number
  local_id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
  inviter_name?: string
  synced: boolean
  remote_id?: number
  created_at: string
}

export interface Attendance {
  id?: number
  local_id: string
  service_local_id: string
  visitor_local_id: string
  checked_in_at: string
  synced: boolean
  remote_id?: number
}

export interface ServiceType {
  id: number
  name: string
}

interface ServiceRow {
  id: number
  local_id: string
  service_type_id: number
  service_type_name: string | null
  location: string | null
  notes: string | null
  started_at: string
  ended_at: string | null
  synced: number
  remote_id: number | null
}

interface VisitorRow {
  id: number
  local_id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  inviter_name: string | null
  synced: number
  remote_id: number | null
  created_at: string
}

interface AttendanceRow {
  id: number
  local_id: string
  service_local_id: string
  visitor_local_id: string
  checked_in_at: string
  synced: number
  remote_id: number | null
}

class DatabaseService {
  private database: SQLite.SQLiteDatabase | null = null

  constructor() {
    setTimeout(() => {
      this.initDatabase()
    }, 100)
  }

  private initDatabase() {
    try {
      this.database = initializeDatabase()

      // Services table
      this.database.execSync(`
        CREATE TABLE IF NOT EXISTS services (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          local_id TEXT UNIQUE NOT NULL,
          service_type_id INTEGER NOT NULL,
          service_type_name TEXT,
          location TEXT,
          notes TEXT,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          synced INTEGER DEFAULT 0,
          remote_id INTEGER
        );
      `)

      // Visitors table
      this.database.execSync(`
        CREATE TABLE IF NOT EXISTS visitors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          local_id TEXT UNIQUE NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          inviter_name TEXT,
          synced INTEGER DEFAULT 0,
          remote_id INTEGER,
          created_at TEXT NOT NULL
        );
      `)

      // Attendance table
      this.database.execSync(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          local_id TEXT UNIQUE NOT NULL,
          service_local_id TEXT NOT NULL,
          visitor_local_id TEXT NOT NULL,
          checked_in_at TEXT NOT NULL,
          synced INTEGER DEFAULT 0,
          remote_id INTEGER,
          FOREIGN KEY (service_local_id) REFERENCES services (local_id),
          FOREIGN KEY (visitor_local_id) REFERENCES visitors (local_id)
        );
      `)

      // Service types cache table
      this.database.execSync(`
        CREATE TABLE IF NOT EXISTS service_types (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        );
      `)
    } catch (error) {
      console.error("Database initialization error:", error)
    }
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.database) {
      this.database = initializeDatabase()
      this.initDatabase()
    }
    return this.database
  }

  // Service methods
  createService(service: Omit<Service, "id">): Promise<Service> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const result = database.runSync(
          `INSERT INTO services (local_id, service_type_id, service_type_name, location, notes, started_at, synced) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            service.local_id,
            service.service_type_id,
            service.service_type_name || null, // Handle undefined values
            service.location || null,
            service.notes || null,
            service.started_at,
            service.synced ? 1 : 0,
          ],
        )
        resolve({ ...service, id: result.lastInsertRowId })
      } catch (error) {
        console.error("Create service error:", error)
        reject(error)
      }
    })
  }

  getActiveService(): Promise<Service | null> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const result = database.getFirstSync(
          "SELECT * FROM services WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
        ) as ServiceRow | null

        if (result) {
          resolve({
            id: result.id,
            local_id: result.local_id,
            service_type_id: result.service_type_id,
            service_type_name: result.service_type_name || undefined,
            location: result.location || undefined,
            notes: result.notes || undefined,
            started_at: result.started_at,
            ended_at: result.ended_at || undefined,
            synced: result.synced === 1,
            remote_id: result.remote_id || undefined,
          })
        } else {
          resolve(null)
        }
      } catch (error) {
        console.error("Get active service error:", error)
        reject(error)
      }
    })
  }

  endService(localId: string, endedAt: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        database.runSync("UPDATE services SET ended_at = ?, synced = 0 WHERE local_id = ?", [endedAt, localId])
        resolve()
      } catch (error) {
        console.error("End service error:", error)
        reject(error)
      }
    })
  }

  // Visitor methods
  createVisitor(visitor: Omit<Visitor, "id">): Promise<Visitor> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const result = database.runSync(
          `INSERT INTO visitors (local_id, first_name, last_name, phone, email, inviter_name, synced, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            visitor.local_id,
            visitor.first_name,
            visitor.last_name,
            visitor.phone || null, // Handle undefined values
            visitor.email || null,
            visitor.inviter_name || null,
            visitor.synced ? 1 : 0,
            visitor.created_at,
          ],
        )
        resolve({ ...visitor, id: result.lastInsertRowId })
      } catch (error) {
        console.error("Create visitor error:", error)
        reject(error)
      }
    })
  }

  searchVisitors(query: string): Promise<Visitor[]> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const results = database.getAllSync(
          `SELECT * FROM visitors 
           WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?
           ORDER BY created_at DESC`,
          [`%${query}%`, `%${query}%`, `%${query}%`],
        ) as VisitorRow[]

        const visitors = results.map(
          (row): Visitor => ({
            id: row.id,
            local_id: row.local_id,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            inviter_name: row.inviter_name || undefined,
            synced: row.synced === 1,
            remote_id: row.remote_id || undefined,
            created_at: row.created_at,
          }),
        )

        resolve(visitors)
      } catch (error) {
        console.error("Search visitors error:", error)
        reject(error)
      }
    })
  }

  // Attendance methods
  createAttendance(attendance: Omit<Attendance, "id">): Promise<Attendance> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const result = database.runSync(
          `INSERT INTO attendance (local_id, service_local_id, visitor_local_id, checked_in_at, synced) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            attendance.local_id,
            attendance.service_local_id,
            attendance.visitor_local_id,
            attendance.checked_in_at,
            attendance.synced ? 1 : 0,
          ],
        )
        resolve({ ...attendance, id: result.lastInsertRowId })
      } catch (error) {
        console.error("Create attendance error:", error)
        reject(error)
      }
    })
  }

  getServiceAttendance(serviceLocalId: string): Promise<Array<Attendance & { visitor: Visitor }>> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const results = database.getAllSync(
          `SELECT a.*, v.first_name, v.last_name, v.phone, v.email 
           FROM attendance a 
           JOIN visitors v ON a.visitor_local_id = v.local_id 
           WHERE a.service_local_id = ? 
           ORDER BY a.checked_in_at DESC`,
          [serviceLocalId],
        ) as Array<
          AttendanceRow & { first_name: string; last_name: string; phone: string | null; email: string | null }
        >

        const attendance = results.map((row) => ({
          id: row.id,
          local_id: row.local_id,
          service_local_id: row.service_local_id,
          visitor_local_id: row.visitor_local_id,
          checked_in_at: row.checked_in_at,
          synced: row.synced === 1,
          remote_id: row.remote_id || undefined,
          visitor: {
            local_id: row.visitor_local_id,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            synced: true,
            created_at: "",
          },
        }))

        resolve(attendance)
      } catch (error) {
        console.error("Get service attendance error:", error)
        reject(error)
      }
    })
  }

  getRecentCheckIns(limit: number = 100): Promise<Array<Attendance & { visitor: Visitor; service: Service }>> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const results = database.getAllSync(
          `SELECT a.*, 
                  v.first_name, v.last_name, v.phone, v.email,
                  s.service_type_name, s.location, s.started_at
           FROM attendance a 
           JOIN visitors v ON a.visitor_local_id = v.local_id 
           JOIN services s ON a.service_local_id = s.local_id
           ORDER BY a.checked_in_at DESC 
           LIMIT ?`,
          [limit],
        ) as Array<
          AttendanceRow & {
            first_name: string
            last_name: string
            phone: string | null
            email: string | null
            service_type_name: string | null
            location: string | null
            started_at: string
          }
        >

        const attendance = results.map((row) => ({
          id: row.id,
          local_id: row.local_id,
          service_local_id: row.service_local_id,
          visitor_local_id: row.visitor_local_id,
          checked_in_at: row.checked_in_at,
          synced: row.synced === 1,
          remote_id: row.remote_id || undefined,
          visitor: {
            local_id: row.visitor_local_id,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            synced: true,
            created_at: "",
          },
          service: {
            local_id: row.service_local_id,
            service_type_id: 0,
            service_type_name: row.service_type_name || undefined,
            location: row.location || undefined,
            started_at: row.started_at,
            synced: true,
          },
        }))

        resolve(attendance)
      } catch (error) {
        console.error("Get recent check-ins error:", error)
        reject(error)
      }
    })
  }

  // Service types methods
  saveServiceTypes(serviceTypes: ServiceType[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        database.runSync("DELETE FROM service_types")

        serviceTypes.forEach((type) => {
          database.runSync("INSERT INTO service_types (id, name) VALUES (?, ?)", [type.id, type.name])
        })

        resolve()
      } catch (error) {
        console.error("Save service types error:", error)
        reject(error)
      }
    })
  }

  getServiceTypes(): Promise<ServiceType[]> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const results = database.getAllSync("SELECT * FROM service_types ORDER BY name") as ServiceType[]
        resolve(results)
      } catch (error) {
        console.error("Get service types error:", error)
        reject(error)
      }
    })
  }

  // Sync methods
  getUnsyncedServices(): Promise<Service[]> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const results = database.getAllSync("SELECT * FROM services WHERE synced = 0") as ServiceRow[]
        const services = results.map(
          (row): Service => ({
            id: row.id,
            local_id: row.local_id,
            service_type_id: row.service_type_id,
            service_type_name: row.service_type_name || undefined,
            location: row.location || undefined,
            notes: row.notes || undefined,
            started_at: row.started_at,
            ended_at: row.ended_at || undefined,
            synced: false,
            remote_id: row.remote_id || undefined,
          }),
        )
        resolve(services)
      } catch (error) {
        console.error("Get unsynced services error:", error)
        reject(error)
      }
    })
  }

  getUnsyncedVisitors(): Promise<Visitor[]> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const results = database.getAllSync("SELECT * FROM visitors WHERE synced = 0") as VisitorRow[]
        const visitors = results.map(
          (row): Visitor => ({
            id: row.id,
            local_id: row.local_id,
            first_name: row.first_name,
            last_name: row.last_name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            inviter_name: row.inviter_name || undefined,
            synced: false,
            remote_id: row.remote_id || undefined,
            created_at: row.created_at,
          }),
        )
        resolve(visitors)
      } catch (error) {
        console.error("Get unsynced visitors error:", error)
        reject(error)
      }
    })
  }

  getUnsyncedAttendance(): Promise<Attendance[]> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const results = database.getAllSync("SELECT * FROM attendance WHERE synced = 0") as AttendanceRow[]
        const attendance = results.map(
          (row): Attendance => ({
            id: row.id,
            local_id: row.local_id,
            service_local_id: row.service_local_id,
            visitor_local_id: row.visitor_local_id,
            checked_in_at: row.checked_in_at,
            synced: false,
            remote_id: row.remote_id || undefined,
          }),
        )
        resolve(attendance)
      } catch (error) {
        console.error("Get unsynced attendance error:", error)
        reject(error)
      }
    })
  }

  markServiceSynced(localId: string, remoteId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        database.runSync("UPDATE services SET synced = 1, remote_id = ? WHERE local_id = ?", [remoteId, localId])
        resolve()
      } catch (error) {
        console.error("Mark service synced error:", error)
        reject(error)
      }
    })
  }

  markVisitorSynced(localId: string, remoteId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        database.runSync("UPDATE visitors SET synced = 1, remote_id = ? WHERE local_id = ?", [remoteId, localId])
        resolve()
      } catch (error) {
        console.error("Mark visitor synced error:", error)
        reject(error)
      }
    })
  }

  markAttendanceSynced(localId: string, remoteId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        database.runSync("UPDATE attendance SET synced = 1, remote_id = ? WHERE local_id = ?", [remoteId, localId])
        resolve()
      } catch (error) {
        console.error("Mark attendance synced error:", error)
        reject(error)
      }
    })
  }

  getServiceByLocalId(localId: string): Promise<Service | null> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const result = database.getFirstSync("SELECT * FROM services WHERE local_id = ?", [localId]) as ServiceRow | null

        if (result) {
          resolve({
            id: result.id,
            local_id: result.local_id,
            service_type_id: result.service_type_id,
            service_type_name: result.service_type_name || undefined,
            location: result.location || undefined,
            notes: result.notes || undefined,
            started_at: result.started_at,
            ended_at: result.ended_at || undefined,
            synced: result.synced === 1,
            remote_id: result.remote_id || undefined,
          })
        } else {
          resolve(null)
        }
      } catch (error) {
        console.error("Get service by local ID error:", error)
        reject(error)
      }
    })
  }

  getVisitorByLocalId(localId: string): Promise<Visitor | null> {
    return new Promise((resolve, reject) => {
      try {
        const database = this.getDb()
        const result = database.getFirstSync("SELECT * FROM visitors WHERE local_id = ?", [localId]) as VisitorRow | null

        if (result) {
          resolve({
            id: result.id,
            local_id: result.local_id,
            first_name: result.first_name,
            last_name: result.last_name,
            phone: result.phone || undefined,
            email: result.email || undefined,
            inviter_name: result.inviter_name || undefined,
            synced: result.synced === 1,
            remote_id: result.remote_id || undefined,
            created_at: result.created_at,
          })
        } else {
          resolve(null)
        }
      } catch (error) {
        console.error("Get visitor by local ID error:", error)
        reject(error)
      }
    })
  }
}

export const databaseService = new DatabaseService()
