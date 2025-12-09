"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Users, UserCheck, Zap, Calendar, Settings, LogOut, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const handleLogout = () => {
    // Clear authentication data
    if (typeof window !== "undefined") {
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("userName")
    }
    // Redirect to login
    router.push("/")
    setLogoutOpen(false)
  }

  const menuItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Members",
      href: "/dashboard/members",
      icon: Users,
    },
    {
      label: "Services",
      href: "/dashboard/services",
      icon: Calendar,
    },
    {
      label: "Visitors",
      href: "/dashboard/visitors",
      icon: UserCheck,
    },
    {
      label: "Attendance",
      href: "/dashboard/attendance",
      icon: Zap,
    },
    {
      label: "Service Types",
      href: "/dashboard/service-types",
      icon: Settings,
    },
  ]

  return (
    <aside className="w-72 bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border/50 h-screen flex flex-col shadow-xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border/50 bg-gradient-to-r from-sidebar-accent/20 to-transparent">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-background shadow-lg ring-2 ring-primary/20 flex-shrink-0">
            <Image
              src="/Logo.jpg"
              alt="Church Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground leading-tight">Church Admin</h1>
            <p className="text-xs text-sidebar-foreground/60 font-medium">Management Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-2 py-2 mb-2">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Navigation</p>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                isActive
                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
              )}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-sidebar-accent/30 text-sidebar-foreground/70 group-hover:bg-sidebar-accent/50 group-hover:text-sidebar-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={cn("font-medium text-sm", isActive && "font-semibold")}>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-sidebar-border/50 bg-gradient-to-r from-sidebar-accent/10 to-transparent">
        <button
          onClick={() => setLogoutOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 text-destructive/70 group-hover:bg-destructive/20 group-hover:text-destructive transition-all">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm group-hover:font-semibold">Logout</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will be redirected to the login page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
