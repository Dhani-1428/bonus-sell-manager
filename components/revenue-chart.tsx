"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

export function RevenueChart({ data }: { data: { name: string; quantity: number }[] }) {
  if (data.length === 0) {
    return (
      <Card className="bg-white border-sidebar">
        <CardHeader>
          <CardTitle className="text-base text-black">Top Items Sold</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No order data yet. Create your first order!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-sidebar">
      <CardHeader>
        <CardTitle className="text-base text-black">Top Items Sold</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-popover)",
                borderColor: "var(--color-border)",
                borderRadius: "8px",
                color: "var(--color-popover-foreground)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="quantity" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
