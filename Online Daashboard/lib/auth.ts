// Authentication utility functions

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false
  return localStorage.getItem("isAuthenticated") === "true"
}

export const getUserName = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("userName")
}

export const logout = (): void => {
  if (typeof window === "undefined") return
  localStorage.removeItem("isAuthenticated")
  localStorage.removeItem("userName")
}

export const login = (userName: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem("isAuthenticated", "true")
  localStorage.setItem("userName", userName)
}

