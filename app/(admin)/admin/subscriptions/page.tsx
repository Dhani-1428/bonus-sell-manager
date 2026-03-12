"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar, Search, Edit, Check, X } from "lucide-react"
import { toast } from "sonner"

interface UserSubscription {
  id: string
  name: string
  email: string
  subscription_status: "trial" | "active" | "expired" | "cancelled"
  subscription_plan: "monthly" | "yearly" | null
  subscription_end_date: string | null
  trial_start_date: string | null
  created_at: string
}

export default function SubscriptionsPage() {
  const [users, setUsers] = useState<UserSubscription[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editingUser, setEditingUser] = useState<UserSubscription | null>(null)
  const [editStatus, setEditStatus] = useState<string>("trial")
  const [editPlan, setEditPlan] = useState<string | undefined>(undefined)
  const [editEndDate, setEditEndDate] = useState<string>("")

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, statusFilter])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/users?limit=1000")
      const data = await response.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load subscriptions")
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.subscription_status === statusFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleEdit = (user: UserSubscription) => {
    setEditingUser(user)
    setEditStatus(user.subscription_status || "trial")
    setEditPlan(user.subscription_plan || undefined)
    setEditEndDate(
      user.subscription_end_date
        ? new Date(user.subscription_end_date).toISOString().split("T")[0]
        : ""
    )
  }

  const handleSave = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_status: editStatus,
          subscription_plan: editPlan || null,
          subscription_end_date: editEndDate || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update subscription")
      }

      toast.success("Subscription updated successfully!")
      setEditingUser(null)
      await loadUsers()
    } catch (error) {
      console.error("Error updating subscription:", error)
      toast.error("Failed to update subscription")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      expired: "destructive",
      cancelled: "outline",
    }
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return "N/A"
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? `${diff} days` : "Expired"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage User Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Plan</th>
                  <th className="text-left p-3">End Date</th>
                  <th className="text-left p-3">Days Remaining</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-3">{getStatusBadge(user.subscription_status)}</td>
                    <td className="p-3">
                      {user.subscription_plan ? (
                        <Badge variant="outline">
                          {user.subscription_plan.charAt(0).toUpperCase() +
                            user.subscription_plan.slice(1)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      {user.subscription_end_date
                        ? new Date(user.subscription_end_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-3">{getDaysRemaining(user.subscription_end_date)}</td>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No subscriptions found
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update the subscription details for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus || "trial"} onValueChange={(value) => setEditStatus(value || "trial")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Plan</label>
              <Select value={editPlan || undefined} onValueChange={(value) => setEditPlan(value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
