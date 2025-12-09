"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { supabaseService, type Visitor, type Service } from "@/lib/supabaseService"

export default function AttendancePage() {
  const [editingAttendance, setEditingAttendance] = useState<number | null>(null)
  const [deletingAttendance, setDeletingAttendance] = useState<number | null>(null)
  const [attendance, setAttendance] = useState<any[]>([])
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadAttendance()
    loadVisitors()
    loadServices()
  }, [])

  const loadAttendance = async () => {
    try {
      setLoading(true)
      const data = await supabaseService.getAttendance()
      setAttendance(data)
    } catch (error) {
      console.error("Error loading attendance:", error)
      alert("Failed to load attendance. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadVisitors = async () => {
    try {
      const data = await supabaseService.getVisitors()
      setVisitors(data)
    } catch (error) {
      console.error("Error loading visitors:", error)
    }
  }

  const loadServices = async () => {
    try {
      const data = await supabaseService.getServices()
      setServices(data)
    } catch (error) {
      console.error("Error loading services:", error)
    }
  }

  const handleEdit = (id: number) => {
    setEditingAttendance(id)
  }

  const handleDelete = (id: number) => {
    setDeletingAttendance(id)
  }

  const handleSaveEdit = async (updatedAttendance: {
    visitor: string
    service: string
    date: string
    status: string
  }) => {
    if (editingAttendance) {
      try {
        const visitor = visitors.find((v) => `${v.first_name} ${v.last_name}` === updatedAttendance.visitor)
        const service = services.find((s) => s.id.toString() === updatedAttendance.service)
        if (!visitor || !service) {
          alert("Visitor or service not found")
          return
        }
        await supabaseService.updateAttendance(editingAttendance, {
          visitor_id: visitor.id,
          service_id: service.id,
          checked_in_at: updatedAttendance.date,
        })
        await loadAttendance()
        setEditingAttendance(null)
      } catch (error) {
        console.error("Error updating attendance:", error)
        alert("Failed to update attendance. Please try again.")
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingAttendance) {
      try {
        await supabaseService.deleteAttendance(deletingAttendance)
        await loadAttendance()
        setDeletingAttendance(null)
      } catch (error) {
        console.error("Error deleting attendance:", error)
        alert("Failed to delete attendance. Please try again.")
      }
    }
  }

  const currentAttendance = editingAttendance ? attendance.find((a) => a.id === editingAttendance) : null
  const deletingAttendanceData = deletingAttendance ? attendance.find((a) => a.id === deletingAttendance) : null

  const filteredAttendance = attendance.filter((record) => {
    const visitorName = record.visitors
      ? `${record.visitors.first_name} ${record.visitors.last_name}`.toLowerCase()
      : ""
    const searchLower = searchQuery.toLowerCase()
    return visitorName.includes(searchLower)
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground">Track service attendance</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Check In
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Total records: {attendance.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search attendance..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Visitor</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Service</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Loading attendance...
                      </td>
                    </tr>
                  ) : filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => {
                      const visitorName = record.visitors
                        ? `${record.visitors.first_name} ${record.visitors.last_name}`
                        : "Unknown"
                      const serviceName = record.services?.service_types?.name || "Unknown"
                      const checkInDate = new Date(record.checked_in_at)
                      return (
                        <tr key={record.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-foreground font-medium">{visitorName}</td>
                          <td className="py-3 px-4 text-foreground">{serviceName}</td>
                          <td className="py-3 px-4 text-foreground">{checkInDate.toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Checked In
                            </span>
                          </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-muted rounded transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(record.id)}>
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Attendance Dialog */}
      {currentAttendance && (
        <EditAttendanceDialog
          attendance={currentAttendance}
          open={!!editingAttendance}
          onOpenChange={(open) => !open && setEditingAttendance(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingAttendance}
        onOpenChange={(open) => !open && setDeletingAttendance(null)}
        onConfirm={handleConfirmDelete}
        itemName={`${deletingAttendanceData?.visitor} - ${deletingAttendanceData?.service}` || ""}
        itemType="attendance record"
      />
    </DashboardLayout>
  )
}

// Edit Attendance Dialog Component
function EditAttendanceDialog({
  attendance,
  open,
  onOpenChange,
  onSave,
}: {
  attendance: { visitor: string; service: string; date: string; status: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (attendance: { visitor: string; service: string; date: string; status: string }) => void
}) {
  const [formData, setFormData] = useState(attendance)

  useEffect(() => {
    setFormData(attendance)
  }, [attendance])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!formData.visitor || !formData.service || !formData.date) {
      alert("Please fill in all required fields")
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogDescription>Update attendance record</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-visitor">Visitor</Label>
            <Input id="edit-visitor" name="visitor" placeholder="Visitor name" value={formData.visitor} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-service">Service</Label>
            <Input id="edit-service" name="service" placeholder="Service name" value={formData.service} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input id="edit-date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Checked In">Checked In</SelectItem>
                <SelectItem value="No Show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
