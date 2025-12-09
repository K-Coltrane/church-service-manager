import axios from "axios"
import { getItemAsync } from "expo-secure-store"
import { supabaseService } from "./supabaseService"

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add auth token to requests (optional since we removed login)
api.interceptors.request.use(async (config) => {
  try {
    const token = await getItemAsync("auth_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (error) {
    // Ignore errors getting token (auth is optional now)
  }
  return config
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress verbose error logging for common network issues
    // Only log if it's not a network/connection error
    if (error.code === "ECONNABORTED") {
      // Timeout - silently fail
    } else if (error.message === "Network Error" || !error.response) {
      // Network error or no response - silently fail
    } else if (error.response?.status >= 500) {
      // Server error - log but don't spam
      console.warn("Server error:", error.response.status)
    }
    return Promise.reject(error)
  },
)

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    name: string
  }
}

export class ApiService {
  private isBackendAvailable(): boolean {
    // Check if API_BASE_URL is set and not localhost (which won't work on mobile)
    const baseUrl = process.env.API_BASE_URL || "http://localhost:3000/api"
    return !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1")
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    if (!this.isBackendAvailable()) {
      throw new Error("Backend not configured")
    }
    const response = await api.post("/auth/login", credentials)
    return response.data
  }

  async getServiceTypes() {
    try {
      // Try Supabase first
      return await supabaseService.getServiceTypes()
    } catch (error: any) {
      // Fallback to old API if Supabase fails
      if (!this.isBackendAvailable()) {
        throw new Error("Backend not configured")
      }
      try {
        const response = await api.get("/service_types")
        return response.data
      } catch (apiError: any) {
        // Fail silently if backend unavailable
        if (!apiError.response && (apiError.message === "Network Error" || apiError.code === "ECONNABORTED")) {
          throw new Error("Backend unavailable")
        }
        throw apiError
      }
    }
  }

  async syncService(service: any) {
    try {
      // Try Supabase first
      const data = await supabaseService.createService(service)
      return { id: data.id }
    } catch (error: any) {
      // Fallback to old API if Supabase fails
      if (!this.isBackendAvailable()) {
        throw new Error("Backend not configured")
      }
      try {
        const response = await api.post("/services", service)
        return response.data
      } catch (apiError: any) {
        // Fail silently for network errors
        if (!apiError.response && (apiError.message === "Network Error" || apiError.code === "ECONNABORTED")) {
          throw new Error("Backend unavailable")
        }
        throw apiError
      }
    }
  }

  async syncVisitor(visitor: any) {
    try {
      // Try Supabase first
      const data = await supabaseService.createVisitor(visitor)
      return { id: data.id }
    } catch (error: any) {
      // Fallback to old API if Supabase fails
      if (!this.isBackendAvailable()) {
        throw new Error("Backend not configured")
      }
      try {
        const response = await api.post("/visitors", visitor)
        return response.data
      } catch (apiError: any) {
        // Fail silently for network errors
        if (!apiError.response && (apiError.message === "Network Error" || apiError.code === "ECONNABORTED")) {
          throw new Error("Backend unavailable")
        }
        throw apiError
      }
    }
  }

  async syncAttendance(attendance: any) {
    try {
      // Try Supabase first
      const data = await supabaseService.createAttendance({
        service_id: attendance.service_id,
        visitor_id: attendance.visitor_id,
        checked_in_at: attendance.checked_in_at,
      })
      return data
    } catch (error: any) {
      // Fallback to old API if Supabase fails
      if (!this.isBackendAvailable()) {
        throw new Error("Backend not configured")
      }
      try {
        const response = await api.post("/attendance/checkin", attendance)
        return response.data
      } catch (apiError: any) {
        // Fail silently for network errors
        if (!apiError.response && (apiError.message === "Network Error" || apiError.code === "ECONNABORTED")) {
          throw new Error("Backend unavailable")
        }
        throw apiError
      }
    }
  }

  async searchVisitors(query: string) {
    try {
      // Try Supabase first
      return await supabaseService.searchVisitors(query)
    } catch (error: any) {
      // Fallback to old API if Supabase fails
      if (!this.isBackendAvailable()) {
        throw new Error("Backend not configured")
      }
      try {
        const response = await api.get(`/visitors/search?q=${encodeURIComponent(query)}`)
        return response.data
      } catch (apiError: any) {
        // Fail silently for network errors
        if (!apiError.response && (apiError.message === "Network Error" || apiError.code === "ECONNABORTED")) {
          throw new Error("Backend unavailable")
        }
        throw apiError
      }
    }
  }
}

export const apiService = new ApiService()
