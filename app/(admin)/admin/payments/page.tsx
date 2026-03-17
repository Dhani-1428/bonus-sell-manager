"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n/context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Payment {
  id: string
  user_id: string
  user_name: string
  user_email: string
  amount: number
  currency: string
  plan: string
  status: string
  created_at: string
  approved_by?: string
}

export default function PaymentsPage() {
  const { t } = useI18n()
  const [payments, setPayments] = useState<Payment[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [statusFilter])

  const loadPayments = async () => {
    setIsLoading(true)
    try {
      const url = statusFilter === "all" 
        ? "/api/admin/payments?limit=100"
        : `/api/admin/payments?status=${statusFilter}&limit=100`
      const response = await fetch(url)
      const data = await response.json()
      setPayments(data.payments || [])
    } catch (error) {
      console.error("Error loading payments:", error)
      toast.error(t.loading || "Failed to load payments")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to approve payment: ${response.status}`)
      }

      toast.success(t.approvePayment + " " + (t.completed || "successfully"))
      loadPayments()
    } catch (error: any) {
      console.error("Error approving payment:", error)
      toast.error(error.message || t.approvePayment + " " + (t.failed || "failed"))
    }
  }

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to reject payment: ${response.status}`)
      }

      toast.success(t.rejectPayment + " " + (t.completed || "successfully"))
      loadPayments()
    } catch (error: any) {
      console.error("Error rejecting payment:", error)
      toast.error(error.message || t.rejectPayment + " " + (t.failed || "failed"))
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: t.pending },
      approved: { variant: "default", label: t.approved },
      rejected: { variant: "destructive", label: t.rejected },
      completed: { variant: "default", label: t.completed },
    }

    const config = variants[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t.payments}</h1>
        <p className="text-muted-foreground">{t.pendingPayments}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.payments}</CardTitle>
              <CardDescription>{t.pendingPayments}</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.filter + " " + t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.status}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="approved">{t.approved}</SelectItem>
                <SelectItem value="rejected">{t.rejected}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t.loading}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.userName}</TableHead>
                  <TableHead>{t.amount}</TableHead>
                  <TableHead>{t.plan}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.date}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {t.loading}
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.user_name}</div>
                          <div className="text-sm text-muted-foreground">{payment.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>€{Number(payment.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.plan}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {payment.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprovePayment(payment.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t.approve}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectPayment(payment.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t.reject}
                            </Button>
                          </div>
                        )}
                        {payment.status === "approved" && (
                          <Badge variant="default">{t.approved}</Badge>
                        )}
                        {payment.status === "rejected" && (
                          <Badge variant="destructive">{t.rejected}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
