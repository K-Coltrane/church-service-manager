"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Users, Calendar, UserCheck, Zap } from "lucide-react"
import { supabaseService } from "@/lib/supabaseService"

export default function DashboardPage() {
  const [totalMembers, setTotalMembers] = useState<number>(0)
  const [servicesThisMonth, setServicesThisMonth] = useState<number>(0)
  const [visitorsThisMonth, setVisitorsThisMonth] = useState<number>(0)
  const [attendanceRate, setAttendanceRate] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Get current month start and end dates
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        // Load all data in parallel
        const [members, services, visitors, attendance] = await Promise.all([
          supabaseService.getMembers(),
          supabaseService.getServices(),
          supabaseService.getVisitors(),
          supabaseService.getAttendance(),
        ])

        // Set total members
        setTotalMembers(members.length)

        // Filter services for this month
        const servicesInMonth = services.filter((service: any) => {
          const serviceDate = new Date(service.started_at)
          return serviceDate >= monthStart && serviceDate <= monthEnd
        })
        setServicesThisMonth(servicesInMonth.length)

        // Filter visitors for this month
        const visitorsInMonth = visitors.filter((visitor: any) => {
          if (!visitor.created_at) return false
          const visitorDate = new Date(visitor.created_at)
          return visitorDate >= monthStart && visitorDate <= monthEnd
        })
        setVisitorsThisMonth(visitorsInMonth.length)

        // Calculate attendance rate
        // Attendance rate = (Unique people who attended this month / Total members) * 100
        // This shows what percentage of members attended at least one service this month
        const attendanceThisMonth = attendance.filter((a: any) => {
          if (!a.checked_in_at) return false
          const attendanceDate = new Date(a.checked_in_at)
          return attendanceDate >= monthStart && attendanceDate <= monthEnd
        })
        
        // Get unique attendees (visitor_id) from this month's attendance
        const uniqueAttendees = new Set(attendanceThisMonth.map((a: any) => a.visitor_id))
        
        // Calculate rate: (unique attendees this month / total members) * 100
        // This represents what % of members attended at least one service
        const attendanceRateValue = members.length > 0 
          ? Math.min(100, Math.round((uniqueAttendees.size / members.length) * 100))
          : uniqueAttendees.size > 0 ? 100 : 0
        setAttendanceRate(attendanceRateValue)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        // Keep default values on error
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const stats = [
    {
      title: "Total Members",
      value: loading ? "..." : formatNumber(totalMembers),
      description: "Active members",
      icon: Users,
      color: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Services This Month",
      value: loading ? "..." : formatNumber(servicesThisMonth),
      description: "Services held",
      icon: Calendar,
      color: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Visitors",
      value: loading ? "..." : formatNumber(visitorsThisMonth),
      description: "This month",
      icon: UserCheck,
      color: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Attendance Rate",
      value: loading ? "..." : `${attendanceRate}%`,
      description: "Current average",
      icon: Zap,
      color: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Here's an overview of your church activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your church system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: "John Doe", action: "joined as member", time: "2 hours ago" },
                { user: "Jane Smith", action: "attended service", time: "4 hours ago" },
                { user: "Mike Johnson", action: "registered as visitor", time: "6 hours ago" },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
