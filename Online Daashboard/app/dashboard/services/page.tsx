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
import { supabaseService, type Service, type ServiceType } from "@/lib/supabaseService"

export default function ServicesPage() {
  const [editingService, setEditingService] = useState<number | null>(null)
  const [deletingService, setDeletingService] = useState<number | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadServices()
    loadServiceTypes()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const data = await supabaseService.getServices()
      setServices(data)
    } catch (error) {
      console.error("Error loading services:", error)
      alert("Failed to load services. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadServiceTypes = async () => {
    try {
      const data = await supabaseService.getServiceTypes()
      setServiceTypes(data)
    } catch (error) {
      console.error("Error loading service types:", error)
    }
  }

  const handleEdit = (id: number) => {
    setEditingService(id)
  }

  const handleDelete = (id: number) => {
    setDeletingService(id)
  }

  const handleSaveEdit = async (updatedService: {
    type: string
    leader: string
    specialGuests: string
    date: string
    time: string
    attendees: number
  }) => {
    if (editingService) {
      try {
        const serviceType = serviceTypes.find((st) => st.name === updatedService.type)
        if (!serviceType) {
          alert("Service type not found")
          return
        }
        const startedAt = `${updatedService.date}T${updatedService.time}:00`
        await supabaseService.updateService(editingService, {
          service_type_id: serviceType.id,
          notes: updatedService.specialGuests,
          started_at: startedAt,
        })
        await loadServices()
        setEditingService(null)
      } catch (error) {
        console.error("Error updating service:", error)
        alert("Failed to update service. Please try again.")
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingService) {
      try {
        await supabaseService.deleteService(deletingService)
        await loadServices()
        setDeletingService(null)
      } catch (error) {
        console.error("Error deleting service:", error)
        alert("Failed to delete service. Please try again.")
      }
    }
  }

  const currentService = editingService ? services.find((s) => s.id === editingService) : null
  const deletingServiceData = deletingService ? services.find((s) => s.id === deletingService) : null

  const filteredServices = services.filter((service) => {
    const serviceTypeName = serviceTypes.find((st) => st.id === service.service_type_id)?.name || ""
    const searchLower = searchQuery.toLowerCase()
    return serviceTypeName.toLowerCase().includes(searchLower) || service.location?.toLowerCase().includes(searchLower)
  })

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Services</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage church services</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </div>

        <Card>
          <CardHeader className="px-4 md:px-6">
            <CardTitle>Service List</CardTitle>
            <CardDescription>Total services: {services.length}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-10 text-sm md:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm md:text-base">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden sm:table-cell">
                      Leader
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden md:table-cell">
                      Special Guests
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden lg:table-cell">
                      Date
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden lg:table-cell">
                      Time
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground">Attendees</th>
                    <th className="text-center py-3 px-2 md:px-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading services...
                      </td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No services found
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => {
                      const serviceTypeName = serviceTypes.find((st) => st.id === service.service_type_id)?.name || "Unknown"
                      const startDate = new Date(service.started_at)
                      return (
                        <tr key={service.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-2 md:px-4 text-foreground font-medium text-sm md:text-base">
                            {serviceTypeName}
                          </td>
                          <td className="py-3 px-2 md:px-4 text-foreground hidden sm:table-cell text-xs md:text-sm">
                            N/A
                          </td>
                          <td className="py-3 px-2 md:px-4 text-foreground hidden md:table-cell text-xs md:text-sm">
                            {service.notes || "None"}
                          </td>
                          <td className="py-3 px-2 md:px-4 text-foreground hidden lg:table-cell text-xs md:text-sm">
                            {startDate.toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 md:px-4 text-foreground hidden lg:table-cell text-xs md:text-sm">
                            {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <span className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                              N/A
                            </span>
                          </td>
                      <td className="py-3 px-2 md:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-muted rounded transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(service.id)}>
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(service.id)}>
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

      {/* Edit Service Dialog */}
      {currentService && (
        <EditServiceDialog
          service={currentService}
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          onSave={handleSaveEdit}
          serviceTypes={serviceTypes}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingService}
        onOpenChange={(open) => !open && setDeletingService(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingServiceData?.type || ""}
        itemType="service"
      />
    </DashboardLayout>
  )
}

// Edit Service Dialog Component
function EditServiceDialog({
  service,
  open,
  onOpenChange,
  onSave,
  serviceTypes,
}: {
  service: Service
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (service: { type: string; leader: string; specialGuests: string; date: string; time: string; attendees: number }) => void
  serviceTypes: ServiceType[]
}) {
  const startDate = new Date(service.started_at)
  const [formData, setFormData] = useState({
    type: "",
    leader: "",
    specialGuests: service.notes || "",
    date: startDate.toISOString().split("T")[0],
    time: startDate.toTimeString().slice(0, 5),
    attendees: 0,
  })

  useEffect(() => {
    const startDate = new Date(service.started_at)
    const serviceType = serviceTypes.find((st) => st.id === service.service_type_id)
    setFormData({
      type: serviceType?.name || "",
      leader: "",
      specialGuests: service.notes || "",
      date: startDate.toISOString().split("T")[0],
      time: startDate.toTimeString().slice(0, 5),
      attendees: 0,
    })
  }, [service, serviceTypes])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: name === "attendees" ? parseInt(value) || 0 : value }))
  }

  const handleSubmit = () => {
    if (!formData.type || !formData.leader || !formData.date || !formData.time) {
      alert("Please fill in all required fields")
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>Update service details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-type">Service Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger id="edit-type">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((st) => (
                  <SelectItem key={st.id} value={st.name}>
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-leader">Leader</Label>
            <Input id="edit-leader" name="leader" placeholder="Service leader" value={formData.leader} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-guests">Special Guests</Label>
            <Input
              id="edit-guests"
              name="specialGuests"
              placeholder="Special guests"
              value={formData.specialGuests}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input id="edit-date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-time">Time</Label>
            <Input id="edit-time" name="time" type="time" value={formData.time} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-attendees">Attendees</Label>
            <Input
              id="edit-attendees"
              name="attendees"
              type="number"
              placeholder="Number of attendees"
              value={formData.attendees}
              onChange={handleInputChange}
            />
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
