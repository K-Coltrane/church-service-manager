"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { setItemAsync, getItemAsync, deleteItemAsync } from "expo-secure-store"
import { apiService, type LoginRequest } from "../services/api"

interface User {
  id: number
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = await getItemAsync("auth_token")
      const userData = await getItemAsync("user_data")

      if (token && userData) {
        setUser(JSON.parse(userData))
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginRequest) => {
    try {
      // Demo credentials for testing
      if (credentials.email === "admin@church.com" && credentials.password === "password123") {
        const demoUser = {
          id: 1,
          email: "admin@church.com",
          name: "Church Admin",
        }
        const demoToken = "demo_token_12345"

        await setItemAsync("auth_token", demoToken)
        await setItemAsync("user_data", JSON.stringify(demoUser))
        setUser(demoUser)
        return
      }

      // Try real API if demo credentials don't match
      const response = await apiService.login(credentials)
      await setItemAsync("auth_token", response.token)
      await setItemAsync("user_data", JSON.stringify(response.user))
      setUser(response.user)
    } catch (error) {
      if (credentials.email === "demo@church.com" && credentials.password === "demo123") {
        const demoUser = {
          id: 2,
          email: "demo@church.com",
          name: "Demo User",
        }
        const demoToken = "demo_token_67890"

        await setItemAsync("auth_token", demoToken)
        await setItemAsync("user_data", JSON.stringify(demoUser))
        setUser(demoUser)
        return
      }
      throw error
    }
  }

  const logout = async () => {
    try {
      await deleteItemAsync("auth_token")
      await deleteItemAsync("user_data")
      setUser(null)
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
