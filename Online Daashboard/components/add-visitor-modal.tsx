"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AddVisitorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddVisitor: (visitor: {
    name: string
    email: string
    phone: string
    invitedBy: string
  }) => void
}

export function AddVisitorModal({ open, onOpenChange, onAddVisitor }: AddVisitorModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    invitedBy: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!formData.name) {
      alert("Please fill in at least the name field")
      return
    }
    onAddVisitor(formData)
    setFormData({
      name: "",
      email: "",
      phone: "",
      invitedBy: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm md:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Visitor</DialogTitle>
          <DialogDescription>Enter visitor details to add them to the system</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" placeholder="Full name" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invitedBy">Invited By</Label>
            <Input
              id="invitedBy"
              name="invitedBy"
              placeholder="Person who invited them"
              value={formData.invitedBy}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Visitor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

