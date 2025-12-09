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
import { supabaseService, type ServiceType } from "@/lib/supabaseService"

export default function ServiceTypesPage() {
  const [editingServiceType, setEditingServiceType] = useState<number | null>(null)
  const [deletingServiceType, setDeletingServiceType] = useState<number | null>(null)
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadServiceTypes()
  }, [])

  const loadServiceTypes = async () => {
    try {
      setLoading(true)
      const data = await supabaseService.getServiceTypes()
      setServiceTypes(data)
    } catch (error) {
      console.error("Error loading service types:", error)
      alert("Failed to load service types. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: number) => {
    setEditingServiceType(id)
  }

  const handleDelete = (id: number) => {
    setDeletingServiceType(id)
  }

  const handleSaveEdit = async (updatedServiceType: {
    name: string
    description: string
    frequency: string
  }) => {
    if (editingServiceType) {
      try {
        await supabaseService.updateServiceType(editingServiceType, {
          name: updatedServiceType.name,
        })
        await loadServiceTypes()
        setEditingServiceType(null)
      } catch (error) {
        console.error("Error updating service type:", error)
        alert("Failed to update service type. Please try again.")
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingServiceType) {
      try {
        await supabaseService.deleteServiceType(deletingServiceType)
        await loadServiceTypes()
        setDeletingServiceType(null)
      } catch (error) {
        console.error("Error deleting service type:", error)
        alert("Failed to delete service type. Please try again.")
      }
    }
  }

  const currentServiceType = editingServiceType ? serviceTypes.find((t) => t.id === editingServiceType) : null
  const deletingServiceTypeData = deletingServiceType ? serviceTypes.find((t) => t.id === deletingServiceType) : null

  const filteredServiceTypes = serviceTypes.filter((type) => {
    const searchLower = searchQuery.toLowerCase()
    return type.name.toLowerCase().includes(searchLower)
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Service Types</h1>
            <p className="text-muted-foreground">Manage church service types</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Service Type
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Type List</CardTitle>
            <CardDescription>Total service types: {serviceTypes.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search service types..."
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
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Frequency</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        Loading service types...
                      </td>
                    </tr>
                  ) : filteredServiceTypes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No service types found
                      </td>
                    </tr>
                  ) : (
                    filteredServiceTypes.map((type) => (
                      <tr key={type.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground font-medium">{type.name}</td>
                        <td className="py-3 px-4 text-foreground">N/A</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            N/A
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
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(type.id)}>
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(type.id)}>
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Service Type Dialog */}
      {currentServiceType && (
        <EditServiceTypeDialog
          serviceType={currentServiceType}
          open={!!editingServiceType}
          onOpenChange={(open) => !open && setEditingServiceType(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingServiceType}
        onOpenChange={(open) => !open && setDeletingServiceType(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingServiceTypeData?.name || ""}
        itemType="service type"
      />
    </DashboardLayout>
  )
}

// Edit Service Type Dialog Component
function EditServiceTypeDialog({
  serviceType,
  open,
  onOpenChange,
  onSave,
}: {
  serviceType: ServiceType
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (serviceType: { name: string; description: string; frequency: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: serviceType.name,
    description: "",
    frequency: "",
  })

  useEffect(() => {
    setFormData({
      name: serviceType.name,
      description: "",
      frequency: "",
    })
  }, [serviceType])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.frequency) {
      alert("Please fill in all fields")
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Service Type</DialogTitle>
          <DialogDescription>Update service type details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" placeholder="Service type name" value={formData.name} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              name="description"
              placeholder="Service description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-frequency">Frequency</Label>
            <Select value={formData.frequency} onValueChange={(value) => handleSelectChange("frequency", value)}>
              <SelectTrigger id="edit-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Annually">Annually</SelectItem>
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
