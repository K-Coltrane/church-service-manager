import type { ServiceType, Visitor } from "./database"
import { supabase } from "./supabaseClient"

export interface SupabaseServiceRecord {
  id: number
  user_id: number
  service_type_id: number
  location?: string
  notes?: string
  started_at: string
  ended_at?: string
  created_at?: string
}

export interface SupabaseVisitorRecord {
  id: number
  first_name: string
  last_name: string
  phone?: string
  email?: string
  inviter_name?: string
  created_at?: string
}

export interface SupabaseAttendanceRecord {
  id: number
  service_id: number
  visitor_id: number
  checked_in_at: string
  created_at?: string
}

export class SupabaseService {
  // ==================== SERVICE OPERATIONS ====================

  /**
   * Add/Create a new service in Supabase
   * @param service - Service data to create
   * @param userId - User ID (defaults to 1 if not provided)
   * @returns Created service with Supabase ID
   */
  async addService(
    service: {
      service_type_id: number
      location?: string
      notes?: string
      started_at: string
      ended_at?: string
    },
    userId: number = 1,
  ): Promise<SupabaseServiceRecord> {
    const { data, error } = await supabase
      .from("services")
      .insert({
        user_id: userId,
        service_type_id: service.service_type_id,
        location: service.location || null,
        notes: service.notes || null,
        started_at: service.started_at,
        ended_at: service.ended_at || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding service to Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Get a service by ID from Supabase
   * @param id - Supabase service ID
   * @returns Service data
   */
  async getServiceById(id: number): Promise<SupabaseServiceRecord> {
    const { data, error } = await supabase.from("services").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching service from Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Update a service in Supabase
   * @param id - Supabase service ID
   * @param updates - Fields to update
   * @returns Updated service
   */
  async updateService(
    id: number,
    updates: {
      location?: string
      notes?: string
      ended_at?: string
    },
  ): Promise<SupabaseServiceRecord> {
    const { data, error } = await supabase
      .from("services")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating service in Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Delete a service from Supabase
   * @param id - Supabase service ID
   */
  async deleteService(id: number): Promise<void> {
    const { error } = await supabase.from("services").delete().eq("id", id)

    if (error) {
      console.error("Error deleting service from Supabase:", error)
      throw error
    }
  }

  /**
   * Get all services from Supabase
   * @param limit - Optional limit
   * @returns Array of services
   */
  async getAllServices(limit?: number): Promise<SupabaseServiceRecord[]> {
    let query = supabase.from("services").select("*").order("started_at", { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching services from Supabase:", error)
      throw error
    }
    return data || []
  }

  // ==================== VISITOR OPERATIONS ====================

  /**
   * Add/Create a new visitor in Supabase
   * @param visitor - Visitor data to create
   * @returns Created visitor with Supabase ID
   */
  async addVisitor(visitor: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
    inviter_name?: string
  }): Promise<SupabaseVisitorRecord> {
    const { data, error } = await supabase
      .from("visitors")
      .insert({
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        phone: visitor.phone || null,
        email: visitor.email || null,
        inviter_name: visitor.inviter_name || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding visitor to Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Get a visitor by ID from Supabase
   * @param id - Supabase visitor ID
   * @returns Visitor data
   */
  async getVisitorById(id: number): Promise<SupabaseVisitorRecord> {
    const { data, error } = await supabase.from("visitors").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching visitor from Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Update a visitor in Supabase
   * @param id - Supabase visitor ID
   * @param updates - Fields to update
   * @returns Updated visitor
   */
  async updateVisitor(
    id: number,
    updates: {
      first_name?: string
      last_name?: string
      phone?: string
      email?: string
      inviter_name?: string
    },
  ): Promise<SupabaseVisitorRecord> {
    const { data, error } = await supabase
      .from("visitors")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating visitor in Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Delete a visitor from Supabase
   * @param id - Supabase visitor ID
   */
  async deleteVisitor(id: number): Promise<void> {
    const { error } = await supabase.from("visitors").delete().eq("id", id)

    if (error) {
      console.error("Error deleting visitor from Supabase:", error)
      throw error
    }
  }

  /**
   * Search visitors in Supabase by name or phone
   * @param query - Search query
   * @returns Array of matching visitors
   */
  async searchVisitors(query: string): Promise<Visitor[]> {
    const searchTerm = `%${query}%`
    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .or(`first_name.ilike."${searchTerm}",last_name.ilike."${searchTerm}",phone.ilike."${searchTerm}"`)
      .limit(50)

    if (error) {
      console.error("Error searching visitors in Supabase:", error)
      throw error
    }
    return data || []
  }

  /**
   * Get all visitors from Supabase
   * @param limit - Optional limit
   * @returns Array of visitors
   */
  async getAllVisitors(limit?: number): Promise<SupabaseVisitorRecord[]> {
    let query = supabase.from("visitors").select("*").order("created_at", { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching visitors from Supabase:", error)
      throw error
    }
    return data || []
  }

  // ==================== ATTENDANCE OPERATIONS ====================

  /**
   * Check in a visitor to a service (Create attendance record)
   * @param visitorId - Supabase visitor ID
   * @param serviceId - Supabase service ID
   * @param checkedInAt - Optional check-in timestamp (defaults to now)
   * @returns Attendance record with ID
   */
  async checkInVisitor(
    visitorId: number,
    serviceId: number,
    checkedInAt?: string,
  ): Promise<{ success: true; id: number; message: string }> {
    // Check if already checked in
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("service_id", serviceId)
      .eq("visitor_id", visitorId)
      .single()

    if (existing) {
      return { success: true, id: existing.id, message: "Visitor already checked in" }
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert({
        service_id: serviceId,
        visitor_id: visitorId,
        checked_in_at: checkedInAt || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error checking in visitor to Supabase:", error)
      throw error
    }
    return { success: true, id: data.id, message: "Visitor checked in successfully" }
  }

  /**
   * Get attendance record by ID
   * @param id - Supabase attendance ID
   * @returns Attendance data
   */
  async getAttendanceById(id: number): Promise<SupabaseAttendanceRecord> {
    const { data, error } = await supabase.from("attendance").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching attendance from Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Get all attendance for a specific service
   * @param serviceId - Supabase service ID
   * @returns Array of attendance records with visitor data
   */
  async getServiceAttendance(serviceId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from("attendance")
      .select(
        `
        *,
        visitor:visitors(*),
        service:services(*)
      `,
      )
      .eq("service_id", serviceId)
      .order("checked_in_at", { ascending: false })

    if (error) {
      console.error("Error fetching service attendance from Supabase:", error)
      throw error
    }
    return data || []
  }

  /**
   * Get all attendance for a specific visitor
   * @param visitorId - Supabase visitor ID
   * @returns Array of attendance records with service data
   */
  async getVisitorAttendance(visitorId: number): Promise<any[]> {
    const { data, error } = await supabase
      .from("attendance")
      .select(
        `
        *,
        service:services(*)
      `,
      )
      .eq("visitor_id", visitorId)
      .order("checked_in_at", { ascending: false })

    if (error) {
      console.error("Error fetching visitor attendance from Supabase:", error)
      throw error
    }
    return data || []
  }

  /**
   * Delete an attendance record
   * @param id - Supabase attendance ID
   */
  async deleteAttendance(id: number): Promise<void> {
    const { error } = await supabase.from("attendance").delete().eq("id", id)

    if (error) {
      console.error("Error deleting attendance from Supabase:", error)
      throw error
    }
  }

  // ==================== SERVICE TYPES OPERATIONS ====================

  /**
   * Fetch all service types from Supabase
   * @returns Array of service types
   */
  async fetchServiceTypes(): Promise<ServiceType[]> {
    const { data, error } = await supabase.from("service_types").select("*").order("name")

    if (error) {
      console.error("Error fetching service types from Supabase:", error)
      throw error
    }
    return data || []
  }

  /**
   * Add a new service type
   * @param serviceType - Service type data
   * @returns Created service type
   */
  async addServiceType(serviceType: { id?: number; name: string }): Promise<ServiceType> {
    const { data, error } = await supabase
      .from("service_types")
      .insert({
        name: serviceType.name,
        ...(serviceType.id && { id: serviceType.id }),
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding service type to Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Update a service type
   * @param id - Service type ID
   * @param name - New name
   * @returns Updated service type
   */
  async updateServiceType(id: number, name: string): Promise<ServiceType> {
    const { data, error } = await supabase
      .from("service_types")
      .update({ name })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating service type in Supabase:", error)
      throw error
    }
    return data
  }

  /**
   * Delete a service type
   * @param id - Service type ID
   */
  async deleteServiceType(id: number): Promise<void> {
    const { error } = await supabase.from("service_types").delete().eq("id", id)

    if (error) {
      console.error("Error deleting service type from Supabase:", error)
      throw error
    }
  }

  // ==================== LEGACY METHODS (for backward compatibility) ====================

  /**
   * @deprecated Use addService() instead
   */
  async createService(service: {
    service_type_id: number
    location?: string
    notes?: string
    started_at: string
    ended_at?: string
  }): Promise<SupabaseServiceRecord> {
    return this.addService(service)
  }

  /**
   * @deprecated Use addVisitor() instead
   */
  async createVisitor(visitor: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
    inviter_name?: string
  }): Promise<SupabaseVisitorRecord> {
    return this.addVisitor(visitor)
  }

  /**
   * @deprecated Use checkInVisitor() instead
   */
  async createAttendance(attendance: {
    service_id: number
    visitor_id: number
    checked_in_at: string
  }): Promise<{ success: true; id: number; message: string }> {
    return this.checkInVisitor(attendance.visitor_id, attendance.service_id, attendance.checked_in_at)
  }

  /**
   * @deprecated Use fetchServiceTypes() instead
   */
  async getServiceTypes(): Promise<ServiceType[]> {
    return this.fetchServiceTypes()
  }
}

export const supabaseService = new SupabaseService()

