"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, MoreVertical, Edit2, Trash2, UserPlus } from "lucide-react"
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
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { AddVisitorModal } from "@/components/add-visitor-modal"
import { supabaseService, type Visitor } from "@/lib/supabaseService"

export default function VisitorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVisitor, setEditingVisitor] = useState<number | null>(null)
  const [deletingVisitor, setDeletingVisitor] = useState<number | null>(null)
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [promotingVisitorId, setPromotingVisitorId] = useState<number | null>(null)

  useEffect(() => {
    loadVisitors()
  }, [])

  const loadVisitors = async () => {
    try {
      setLoading(true)
      const data = await supabaseService.getVisitors()
      setVisitors(data)
    } catch (error) {
      console.error("Error loading visitors:", error)
      alert("Failed to load visitors. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: number) => {
    setEditingVisitor(id)
  }

  const handleAddVisitor = async (newVisitor: {
    name: string
    email: string
    phone: string
    invitedBy: string
  }) => {
    try {
      const [firstName, ...lastNameParts] = newVisitor.name.split(" ")
      const lastName = lastNameParts.join(" ") || ""
      await supabaseService.addVisitor({
        first_name: firstName,
        last_name: lastName,
        email: newVisitor.email || undefined,
        phone: newVisitor.phone || undefined,
        inviter_name: newVisitor.invitedBy || undefined,
      })
      await loadVisitors()
      setIsModalOpen(false)
    } catch (error: any) {
      console.error("Error adding visitor:", error)
      alert("Failed to add visitor. Please try again.")
    }
  }

  const handleDelete = (id: number) => {
    setDeletingVisitor(id)
  }

  const handleSaveEdit = async (updatedVisitor: {
    name: string
    email: string
    phone: string
    location: string
    invitedBy: string
    visitDate: string
  }) => {
    if (editingVisitor) {
      try {
        const [firstName, ...lastNameParts] = updatedVisitor.name.split(" ")
        const lastName = lastNameParts.join(" ") || ""
        await supabaseService.updateVisitor(editingVisitor, {
          first_name: firstName,
          last_name: lastName,
          email: updatedVisitor.email,
          phone: updatedVisitor.phone,
          inviter_name: updatedVisitor.invitedBy,
        })
        await loadVisitors()
        setEditingVisitor(null)
      } catch (error) {
        console.error("Error updating visitor:", error)
        alert("Failed to update visitor. Please try again.")
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (deletingVisitor) {
      try {
        await supabaseService.deleteVisitor(deletingVisitor)
        await loadVisitors()
        setDeletingVisitor(null)
      } catch (error) {
        console.error("Error deleting visitor:", error)
        alert("Failed to delete visitor. Please try again.")
      }
    }
  }

  const handlePromote = async (id: number) => {
    // Prevent multiple promotions at once
    if (promotingVisitorId !== null) {
      console.log("Promotion already in progress, ignoring duplicate click")
      return
    }

    const visitor = visitors.find((v) => v.id === id)
    if (!visitor) {
      console.error("Visitor not found with id:", id)
      return
    }

    // Set promoting flag immediately to prevent duplicate clicks
    setPromotingVisitorId(id)

    if (confirm(`Promote ${visitor.first_name} ${visitor.last_name} to member? This will move them from visitors to members.`)) {
      await promoteVisitorToMember(visitor)
    } else {
      // User cancelled, reset the flag
      setPromotingVisitorId(null)
    }
  }

  const promoteVisitorToMember = async (visitor: Visitor) => {
    try {
      console.log("=== PROMOTING VISITOR ===")
      console.log("Visitor ID:", visitor.id)
      console.log("Visitor data:", visitor)
      
      // Double-check we're only promoting this specific visitor
      if (promotingVisitorId !== visitor.id) {
        console.warn("Promotion ID mismatch, aborting")
        setPromotingVisitorId(null)
        return
      }
      
      // First, test if we can access the members table
      console.log("Testing members table access...")
      const testResult = await supabaseService.testMembersTable()
      console.log("Test result:", testResult)
      
      if (!testResult.success) {
        if (testResult.details?.type === 'RLS_PERMISSION_ERROR') {
          const errorMsg = `Cannot insert into members table. Row Level Security (RLS) is blocking the operation.\n\n` +
            `Error: ${testResult.error}\n\n` +
            `QUICK FIX:\n` +
            `1. Go to Supabase Dashboard → SQL Editor\n` +
            `2. Run the SQL commands from SUPABASE_RLS_FIX.sql file\n` +
            `   OR manually create a policy:\n` +
            `   - Go to Authentication → Policies\n` +
            `   - Find 'members' table\n` +
            `   - Click "New Policy"\n` +
            `   - Name: "Allow anon insert"\n` +
            `   - Operation: INSERT\n` +
            `   - Roles: anon, authenticated\n` +
            `   - WITH CHECK: true`
          alert(errorMsg)
          console.error("RLS Error Details:", testResult.details)
        } else {
          alert(`Cannot access members table: ${testResult.error}\n\nPlease check:\n1. The 'members' table exists in Supabase\n2. Row Level Security (RLS) allows INSERT operations\n3. The anon key has proper permissions`)
        }
        return
      }
      
      console.log("Table access test passed, proceeding with insert...")
      
      // Add to members table
      const member = await supabaseService.addMember({
        first_name: visitor.first_name,
        last_name: visitor.last_name,
        email: visitor.email,
        phone: visitor.phone,
        location: "",
        department: "",
        status: "Active",
      })

      console.log("Member created successfully:", member)

      // Only delete visitor if member was successfully created
      if (member && member.id) {
        await supabaseService.deleteVisitor(visitor.id)
        // Reload visitors list
        await loadVisitors()
        alert(`${visitor.first_name} ${visitor.last_name} has been promoted to member successfully!`)
      } else {
        throw new Error("Failed to create member record - no ID returned")
      }
      
      // Reset promoting flag after successful promotion
      setPromotingVisitorId(null)
    } catch (error: any) {
      console.error("=== ERROR PROMOTING VISITOR ===")
      console.error("Error type:", typeof error)
      console.error("Error constructor:", error?.constructor?.name)
      console.error("Error keys:", Object.keys(error || {}))
      console.error("Error values:", Object.values(error || {}))
      console.error("Full error object:", error)
      console.error("Error stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      
      // Try to extract error information from various possible structures
      let errorMessage = "Unknown error"
      let errorCode = ""
      let errorHint = ""
      let errorDetails = ""
      
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error
        } else if (error.message) {
          errorMessage = error.message
        } else if (error.error?.message) {
          errorMessage = error.error.message
        } else if (error.originalError?.message) {
          errorMessage = error.originalError.message
        }
        
        errorCode = error.code || error.error?.code || error.originalError?.code || ""
        errorHint = error.hint || error.error?.hint || error.originalError?.hint || ""
        errorDetails = error.details || error.error?.details || error.originalError?.details || ""
      }
      
      console.log("Extracted - Code:", errorCode, "Message:", errorMessage, "Hint:", errorHint)
      
      // Check for specific error types
      const errorMsgLower = errorMessage.toLowerCase()
      const errorHintLower = (errorHint || "").toLowerCase()
      const errorDetailsLower = (errorDetails || "").toLowerCase()
      
      if (
        errorCode === "42P01" || 
        errorMsgLower.includes("does not exist") || 
        errorMsgLower.includes("relation") || 
        errorMsgLower.includes("members") ||
        errorHintLower.includes("members") ||
        errorDetailsLower.includes("members")
      ) {
        alert("Members table does not exist in Supabase. Please create the 'members' table first.")
      } else if (errorMsgLower.includes("duplicate") || errorMsgLower.includes("unique") || errorCode === "23505") {
        alert("This person may already be a member. Please check the members list.")
      } else if (
        errorMsgLower.includes("permission") || 
        errorMsgLower.includes("policy") || 
        errorMsgLower.includes("row-level security") ||
        errorMsgLower.includes("rls") ||
        errorCode === "42501" ||
        errorCode === "PGRST301"
      ) {
        alert(
          "Permission denied. Row Level Security (RLS) is blocking the insert.\n\n" +
          "To fix this in Supabase:\n" +
          "1. Go to Authentication → Policies\n" +
          "2. Find the 'members' table\n" +
          "3. Create a policy allowing INSERT for 'anon' role\n" +
          "   OR temporarily disable RLS for testing"
        )
      } else {
        const fullError = `Code: ${errorCode || "N/A"}\nMessage: ${errorMessage}\n${errorHint ? `Hint: ${errorHint}` : ""}`
        alert(`Failed to promote visitor to member:\n\n${fullError}\n\nPlease check the browser console (F12) for more details.`)
      }
      
      // Reset promoting flag on error
      setPromotingVisitorId(null)
    }
  }

  const currentVisitor = editingVisitor ? visitors.find((v) => v.id === editingVisitor) : null
  const deletingVisitorData = deletingVisitor ? visitors.find((v) => v.id === deletingVisitor) : null

  const filteredVisitors = visitors.filter((visitor) => {
    const fullName = `${visitor.first_name} ${visitor.last_name}`.toLowerCase()
    const searchLower = searchQuery.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      visitor.email?.toLowerCase().includes(searchLower) ||
      visitor.phone?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <DashboardLayout>
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Visitors</h1>
            <p className="text-sm md:text-base text-muted-foreground">Track church visitors</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Visitor
          </Button>
        </div>

        <Card>
          <CardHeader className="px-4 md:px-6">
            <CardTitle>Visitor List</CardTitle>
            <CardDescription>Total visitors: {visitors.length}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search visitors..."
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
                      Invited By
                    </th>
                    <th className="text-left py-3 px-2 md:px-4 font-semibold text-muted-foreground hidden lg:table-cell">
                      Visit Date
                    </th>
                    <th className="text-center py-3 px-2 md:px-4 font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        Loading visitors...
                      </td>
                    </tr>
                  ) : filteredVisitors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No visitors found
                      </td>
                    </tr>
                  ) : (
                    filteredVisitors.map((visitor) => (
                      <tr key={visitor.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-2 md:px-4 text-foreground font-medium text-sm md:text-base">
                          {visitor.first_name} {visitor.last_name}
                        </td>
                        <td className="py-3 px-2 md:px-4 text-foreground hidden sm:table-cell text-xs md:text-sm">
                          {visitor.email || "N/A"}
                        </td>
                        <td className="py-3 px-2 md:px-4 text-foreground hidden md:table-cell text-xs md:text-sm">
                          {visitor.phone || "N/A"}
                        </td>
                        <td className="py-3 px-2 md:px-4 text-foreground hidden lg:table-cell text-xs md:text-sm">
                          N/A
                        </td>
                        <td className="py-3 px-2 md:px-4 text-foreground hidden md:table-cell text-xs md:text-sm">
                          {visitor.inviter_name || "N/A"}
                        </td>
                        <td className="py-3 px-2 md:px-4 text-foreground hidden lg:table-cell text-xs md:text-sm">
                          {visitor.created_at ? new Date(visitor.created_at).toLocaleDateString() : "N/A"}
                        </td>
                      <td className="py-3 px-2 md:px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-muted rounded transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="gap-2" 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(visitor.id)
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 text-primary" 
                              disabled={promotingVisitorId !== null}
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePromote(visitor.id)
                              }}
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>{promotingVisitorId === visitor.id ? "Promoting..." : "Promote to Member"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 text-destructive" 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(visitor.id)
                              }}
                            >
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

      {/* Edit Visitor Dialog */}
      {currentVisitor && (
        <EditVisitorDialog
          visitor={currentVisitor}
          open={!!editingVisitor}
          onOpenChange={(open) => !open && setEditingVisitor(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingVisitor}
        onOpenChange={(open) => !open && setDeletingVisitor(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingVisitorData?.name || ""}
        itemType="visitor"
      />

      {/* Add Visitor Modal */}
      <AddVisitorModal open={isModalOpen} onOpenChange={setIsModalOpen} onAddVisitor={handleAddVisitor} />
    </DashboardLayout>
  )
}

// Edit Visitor Dialog Component
function EditVisitorDialog({
  visitor,
  open,
  onOpenChange,
  onSave,
}: {
  visitor: Visitor
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (visitor: { name: string; email: string; phone: string; location: string; invitedBy: string; visitDate: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: `${visitor.first_name} ${visitor.last_name}`,
    email: visitor.email || "",
    phone: visitor.phone || "",
    location: "",
    invitedBy: visitor.inviter_name || "",
    visitDate: visitor.created_at ? new Date(visitor.created_at).toISOString().split("T")[0] : "",
  })

  useEffect(() => {
    setFormData({
      name: `${visitor.first_name} ${visitor.last_name}`,
      email: visitor.email || "",
      phone: visitor.phone || "",
      location: "",
      invitedBy: visitor.inviter_name || "",
      visitDate: visitor.created_at ? new Date(visitor.created_at).toISOString().split("T")[0] : "",
    })
  }, [visitor])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Please fill in all required fields")
      return
    }
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Visitor</DialogTitle>
          <DialogDescription>Update visitor details</DialogDescription>
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
            <Label htmlFor="edit-invitedBy">Invited By</Label>
            <Input
              id="edit-invitedBy"
              name="invitedBy"
              placeholder="Person who invited"
              value={formData.invitedBy}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-visitDate">Visit Date</Label>
            <Input
              id="edit-visitDate"
              name="visitDate"
              type="date"
              value={formData.visitDate}
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
