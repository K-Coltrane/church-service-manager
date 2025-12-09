import { supabase } from './supabaseClient'

// Types
export interface ServiceType {
  id: number
  name: string
}

export interface Visitor {
  id: number
  first_name: string
  last_name: string
  phone?: string
  email?: string
  inviter_name?: string
  created_at?: string
}

export interface Service {
  id: number
  user_id: number
  service_type_id: number
  location?: string
  notes?: string
  started_at: string
  ended_at?: string
  created_at?: string
}

export interface Attendance {
  id: number
  service_id: number
  visitor_id: number
  checked_in_at: string
  created_at?: string
}

export interface Member {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  location?: string
  department?: string
  status?: string
}

// Supabase Service Class
export class SupabaseService {
  // ==================== TEST CONNECTION ====================
  async testMembersTable(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      // Try to query the table first to see if it exists
      const { data, error } = await supabase
        .from('members')
        .select('id')
        .limit(1)

      if (error) {
        const errorObj = error as any
        return {
          success: false,
          error: errorObj.message || String(error),
          details: {
            code: errorObj.code,
            hint: errorObj.hint,
            details: errorObj.details,
          },
        }
      }

      // Also test insert permissions (this is likely the issue)
      // Table uses 'name' column, not 'first_name'/'last_name'
      const testInsert: any = {
        name: 'Test User',
        status: 'Active',
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('members')
        .insert(testInsert)
        .select()
        .single()

      if (insertError) {
        const insertErr = insertError as any
        // Clean up if insert succeeded but we got an error
        if (insertData?.id) {
          await supabase.from('members').delete().eq('id', insertData.id)
        }
        return {
          success: false,
          error: `Insert test failed: ${insertErr.message || String(insertError)}`,
          details: {
            code: insertErr.code,
            hint: insertErr.hint,
            details: insertErr.details,
            type: 'RLS_PERMISSION_ERROR',
          },
        }
      }

      // Clean up test data
      if (insertData?.id) {
        await supabase.from('members').delete().eq('id', insertData.id)
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || String(error),
        details: error,
      }
    }
  }

  // ==================== VISITORS ====================
  async getVisitors(): Promise<Visitor[]> {
    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async addVisitor(visitor: {
    first_name: string
    last_name: string
    phone?: string
    email?: string
    inviter_name?: string
  }): Promise<Visitor> {
    const { data, error } = await supabase
      .from('visitors')
      .insert(visitor)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateVisitor(id: number, updates: Partial<Visitor>): Promise<Visitor> {
    const { data, error } = await supabase
      .from('visitors')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteVisitor(id: number): Promise<void> {
    const { error } = await supabase.from('visitors').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== SERVICES ====================
  async getServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*, service_types(name)')
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async addService(service: {
    user_id?: number
    service_type_id: number
    location?: string
    notes?: string
    started_at: string
    ended_at?: string
  }): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert({ user_id: 1, ...service })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteService(id: number): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== SERVICE TYPES ====================
  async getServiceTypes(): Promise<ServiceType[]> {
    const { data, error } = await supabase.from('service_types').select('*').order('name')

    if (error) throw error
    return data || []
  }

  async addServiceType(serviceType: { name: string; description?: string; frequency?: string }): Promise<ServiceType> {
    const { data, error } = await supabase
      .from('service_types')
      .insert({ name: serviceType.name })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateServiceType(id: number, updates: Partial<ServiceType>): Promise<ServiceType> {
    const { data, error } = await supabase
      .from('service_types')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteServiceType(id: number): Promise<void> {
    const { error } = await supabase.from('service_types').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== ATTENDANCE ====================
  async getAttendance(): Promise<any[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(
        `
        *,
        visitors(first_name, last_name),
        services(service_types(name))
      `
      )
      .order('checked_in_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async addAttendance(attendance: {
    service_id: number
    visitor_id: number
    checked_in_at: string
  }): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendance)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateAttendance(id: number, updates: Partial<Attendance>): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAttendance(id: number): Promise<void> {
    const { error } = await supabase.from('attendance').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== MEMBERS ====================
  async getMembers(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Error fetching members:", error)
      throw error
    }
    
    // Transform data if table uses 'name' instead of 'first_name'/'last_name'
    if (data && data.length > 0 && data[0].name && !data[0].first_name) {
      return data.map((member: any) => {
        const nameParts = (member.name || '').split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        return {
          ...member,
          first_name: firstName,
          last_name: lastName,
        }
      })
    }
    
    return data || []
  }
  
  async getMemberById(id: number): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    
    // Transform if table uses 'name' instead of 'first_name'/'last_name'
    if (data && data.name && !data.first_name) {
      const nameParts = (data.name || '').split(' ')
      return {
        ...data,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
      }
    }
    
    return data
  }

  async addMember(member: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    location?: string
    department?: string
    status?: string
  }): Promise<Member> {
    console.log("Attempting to add member:", member)
    
    // Combine first_name and last_name into name (for table schema compatibility)
    const fullName = `${member.first_name} ${member.last_name}`.trim()
    
    const insertData: any = {
      name: fullName, // Table has 'name' column, not 'first_name'/'last_name'
      email: member.email || null,
      phone: member.phone || null,
      location: member.location || null,
      department: member.department || null,
      status: member.status || 'Active',
    }
    
    console.log("Insert data:", insertData)
    
    const { data, error } = await supabase
      .from('members')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      // Log error in a way that preserves information
      console.error("=== SUPABASE INSERT ERROR ===")
      console.error("Error object:", error)
      
      // Try to extract error information
      let errorMessage = "Failed to add member"
      let errorCode = ""
      let errorHint = ""
      let errorDetails = ""
      
      // Supabase errors are PostgrestError objects
      try {
        // Access properties directly
        errorCode = (error as any).code || ""
        errorMessage = (error as any).message || errorMessage
        errorHint = (error as any).hint || ""
        errorDetails = (error as any).details || ""
        
        // Also try to stringify
        const errorStr = JSON.stringify(error, null, 2)
        console.error("Error JSON:", errorStr)
        
        console.error("Extracted - Code:", errorCode)
        console.error("Extracted - Message:", errorMessage)
        console.error("Extracted - Hint:", errorHint)
        console.error("Extracted - Details:", errorDetails)
      } catch (e) {
        console.error("Could not extract error properties:", e)
        errorMessage = String(error) || errorMessage
      }
      
      console.error("============================")
      
      // Create error with available info
      const err = new Error(errorMessage) as any
      err.code = errorCode
      err.hint = errorHint
      err.details = errorDetails
      throw err
    }
    
    if (!data) {
      throw new Error("No data returned from Supabase after insert")
    }
    
    console.log("Member successfully added:", data)
    
    // Transform response back to our interface format if table uses 'name'
    if (data && data.name && !data.first_name) {
      const nameParts = (data.name || '').split(' ')
      return {
        ...data,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
      }
    }
    
    return data
  }

  async updateMember(id: number, updates: Partial<Member>): Promise<Member> {
    // Transform updates if table uses 'name' instead of 'first_name'/'last_name'
    const updateData: any = { ...updates }
    
    // If updating first_name or last_name, combine into name
    if (updates.first_name !== undefined || updates.last_name !== undefined) {
      // Get current member to combine names properly
      const current = await this.getMemberById(id)
      const firstName = updates.first_name !== undefined ? updates.first_name : current.first_name
      const lastName = updates.last_name !== undefined ? updates.last_name : current.last_name
      updateData.name = `${firstName} ${lastName}`.trim()
      delete updateData.first_name
      delete updateData.last_name
    }
    
    const { data, error } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    // Transform response back to our interface format
    if (data && data.name && !data.first_name) {
      const nameParts = (data.name || '').split(' ')
      return {
        ...data,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
      }
    }
    
    return data
  }

  async deleteMember(id: number): Promise<void> {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) throw error
  }
}

export const supabaseService = new SupabaseService()

