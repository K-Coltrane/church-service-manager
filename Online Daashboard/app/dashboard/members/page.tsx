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
import { AddMemberModal } from "@/components/add-member-modal"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { supabaseService, type Member } from "@/lib/supabaseService"

export default function MembersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<number | null>(null)
  const [deletingMember, setDeletingMember] = useState<number | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const data = await supabaseService.getMembers()
      setMembers(data)
    } catch (error) {
      console.error("Error loading members:", error)
      alert("Failed to load members. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (newMember: {
    name: string
    email: string
    phone: string
    location: string
    department: string
    status: string
  }) => {
    try {
      const [firstName, ...lastNameParts] = newMember.name.split(" ")
      const lastName = lastNameParts.join(" ") || ""
      const result = await supabaseService.addMember({
        first_name: firstName,
        last_name: lastName,
        email: newMember.email,
        phone: newMember.phone,
        location: newMember.location,
        department: newMember.department,
        status: newMember.status,
      })
      await loadMembers()
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("Error adding member:", error)
      if (error.code === '42P01') {
        alert("Members table does not exist in Supabase. Please create the 'members' table first.")
      } else {
        alert("Failed to add member. Please try again.")
      }
    }
  }

  const handleEdit = (id: number) => {
    setEditingMember(id)
  }

  const handleDelete = (id: number) => {
    setDeletingMember(id)
  }

  const handleSaveEdit = async (updatedMember: {
    name: string
    email: string
    phone: string
    location: string
    department: string
    status: string
  }) => {
    if (editingMember) {
      try {
        const [firstName, ...lastNameParts] = updatedMember.name.split(" ")
        const lastName = lastNameParts.join(" ") || ""
        await supabaseService.updateMember(editingMember, {
          first_name: firstName,
          last_name: lastName,
          email: updatedMember.email,
          phone: updatedMember.phone,
          location: updatedMember.location,
          department: updatedMember.department,
          status: updatedMember.status,
        })
        await loadMembers()
        setEditingMember(null)
      } catch (error) {
        console.error("Error updating member:", error)
        alert("Failed to update member. Please try again.")
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingMember) {
      try {
        await supabaseService.deleteMember(deletingMember)
        await loadMembers()
        setDeletingMember(null)
      } catch (error) {
        console.error("Error deleting member:", error)
        alert("Failed to delete member. Please try again.")
      }
    }
  }

  const currentMember = editingMember ? members.find((m) => m.id === editingMember) : null
  const deletingMemberData = deletingMember ? members.find((m) => m.id === deletingMember) : null

  const filteredMembers = members.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const searchLower = searchQuery.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.phone?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Members</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage all church members</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        </div>

        <Card>
          <CardHeader className="px-4 md:px-6">
            <CardTitle>Member List</CardTitle>
            <CardDescription>Total members: {members.length}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
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
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden sm:table-cell">
                      Email
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden md:table-cell">
                      Phone
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden lg:table-cell">
                      Location
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden md:table-cell">
                      Department
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-center py-3 px-2 md:px-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading members...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No members found
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 md:px-4 text-foreground font-medium text-sm md:text-base">
                          {member.first_name} {member.last_name}
                        </td>
                      <td className="py-3 px-2 md:px-4 text-foreground hidden sm:table-cell text-xs md:text-sm">
                        {member.email}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-foreground hidden md:table-cell text-xs md:text-sm">
                        {member.phone}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-foreground hidden lg:table-cell text-xs md:text-sm">
                        {member.location}
                      </td>
                      <td className="py-3 px-2 md:px-4 text-foreground hidden md:table-cell text-xs md:text-sm">
                        {member.department}
                      </td>
                      <td className="py-3 px-2 md:px-4">
                        <span
                          className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                            member.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {member.status}
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
                            <DropdownMenuItem className="gap-2" onClick={() => handleEdit(member.id)}>
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(member.id)}>
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddMemberModal open={isModalOpen} onOpenChange={setIsModalOpen} onAddMember={handleAddMember} />

      {/* Edit Member Dialog */}
      {currentMember && (
        <EditMemberDialog
          member={currentMember}
          open={!!editingMember}
          onOpenChange={(open) => !open && setEditingMember(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingMember}
        onOpenChange={(open) => !open && setDeletingMember(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingMemberData?.name || ""}
        itemType="member"
      />
    </DashboardLayout>
  )
}

// Edit Member Dialog Component
function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onSave,
}: {
  member: Member
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (member: { name: string; email: string; phone: string; location: string; department: string; status: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: `${member.first_name} ${member.last_name}`,
    email: member.email || "",
    phone: member.phone || "",
    location: member.location || "",
    department: member.department || "",
    status: member.status || "Active",
  })

  useEffect(() => {
    setFormData({
      name: `${member.first_name} ${member.last_name}`,
      email: member.email || "",
      phone: member.phone || "",
      location: member.location || "",
      department: member.department || "",
      status: member.status || "Active",
    })
  }, [member])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.location || !formData.department) {
      alert("Please fill in all fields")
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>Update member details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" name="name" placeholder="Full name" value={formData.name} onChange={handleInputChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-location">Location</Label>
            <Input
              id="edit-location"
              name="location"
              placeholder="City or area"
              value={formData.location}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-department">Department</Label>
            <Select value={formData.department} onValueChange={(value) => handleSelectChange("department", value)}>
              <SelectTrigger id="edit-department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Worship Team">Worship Team</SelectItem>
                <SelectItem value="Youth Ministry">Youth Ministry</SelectItem>
                <SelectItem value="Ushers">Ushers</SelectItem>
                <SelectItem value="Pastoral Team">Pastoral Team</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
                <SelectItem value="Outreach">Outreach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
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

