"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft,
  Save,
  Calendar,
  Mail,
  User,
  CreditCard,
  Package,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserDetails {
  user: {
    id: string
    name: string
    email: string
    created_at: string
    trial_start_date?: string
    subscription_status: string
    subscription_end_date?: string
    subscription_plan?: string
    role: string
    trial_expiration_email_sent: boolean
  }
  stats: {
    ordersCount: number
    menuItemsCount: number
  }
  recentPayments: any[]
}

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const [userData, setUserData] = useState<UserDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subscription_status: "",
    subscription_end_date: "",
    subscription_plan: "",
    trial_start_date: "",
    role: "",
  })

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/session")
        const data = await response.json()

        if (!data.admin) {
          router.push("/admin/login")
          return
        }

        loadUserData()
      } catch (error) {
        console.error("Session check error:", error)
        router.push("/admin/login")
      }
    }

    checkSession()
  }, [router, userId])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load user")
      }

      setUserData(data)
      setFormData({
        name: data.user.name,
        email: data.user.email,
        subscription_status: data.user.subscription_status,
        subscription_end_date: data.user.subscription_end_date
          ? new Date(data.user.subscription_end_date).toISOString().slice(0, 16)
          : "",
        subscription_plan: data.user.subscription_plan || "",
        trial_start_date: data.user.trial_start_date
          ? new Date(data.user.trial_start_date).toISOString().slice(0, 16)
          : "",
        role: data.user.role,
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to load user data")
      router.push("/admin/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user")
      }

      toast.success("User updated successfully!")
      loadUserData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update user")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Edit user details and subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription_status">Subscription Status</Label>
                <Select
                  value={formData.subscription_status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subscription_status: value })
                  }
                >
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
              <div className="space-y-2">
                <Label htmlFor="subscription_plan">Subscription Plan</Label>
                <Select
                  value={formData.subscription_plan}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subscription_plan: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly (6 Months)</SelectItem>
                    <SelectItem value="yearly">Yearly (12 Months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription_end_date">Subscription End Date</Label>
                <Input
                  id="subscription_end_date"
                  type="datetime-local"
                  value={formData.subscription_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, subscription_end_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trial_start_date">Trial Start Date</Label>
                <Input
                  id="trial_start_date"
                  type="datetime-local"
                  value={formData.trial_start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, trial_start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* User Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Orders</span>
                  </div>
                  <Badge variant="outline">{userData.stats.ordersCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>Menu Items</span>
                  </div>
                  <Badge variant="outline">{userData.stats.menuItemsCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Created</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(userData.user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {userData.recentPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments found</p>
                ) : (
                  <div className="space-y-2">
                    {userData.recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <div className="font-medium">€{payment.amount}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant={payment.status === "approved" ? "default" : "outline"}>
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
