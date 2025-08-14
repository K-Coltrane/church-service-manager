import axios from "axios"
import { getItemAsync } from "expo-secure-store"

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getItemAsync("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post("/auth/login", credentials)
    return response.data
  }

  async getServiceTypes() {
    const response = await api.get("/service_types")
    return response.data
  }

  async syncService(service: any) {
    const response = await api.post("/services", service)
    return response.data
  }

  async syncVisitor(visitor: any) {
    const response = await api.post("/visitors", visitor)
    return response.data
  }

  async syncAttendance(attendance: any) {
    const response = await api.post("/attendance", attendance)
    return response.data
  }

  async searchVisitors(query: string) {
    const response = await api.get(`/visitors/search?q=${encodeURIComponent(query)}`)
    return response.data
  }
}

export const apiService = new ApiService()
