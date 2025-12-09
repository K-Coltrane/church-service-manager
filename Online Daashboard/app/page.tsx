"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { isAuthenticated } from "@/lib/auth"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validate inputs
      if (!name || !password) {
        setError("Please fill in all fields")
        setLoading(false)
        return
      }

      // Define valid users
      const validUsers = [
        { name: "Admin", password: "admin123" },
        { name: "Admin2", password: "admin123" },
      ]

      // Check if credentials match
      const user = validUsers.find(
        (u) => u.name.toLowerCase() === name.trim().toLowerCase() && u.password === password
      )

      if (!user) {
        setError("Invalid username or password")
        setLoading(false)
        return
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Store authentication in localStorage
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userName", user.name)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError("Login failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-6 pb-8">
            {/* Logo Section */}
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-background shadow-lg ring-4 ring-primary/10">
                <Image
                  src="/Logo.jpg"
                  alt="Church Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Title Section */}
            <div className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold text-foreground">Church Admin</CardTitle>
              <CardDescription className="text-base">Sign in to access your dashboard</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-semibold text-foreground">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-11 text-base"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 text-base"
                />
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
