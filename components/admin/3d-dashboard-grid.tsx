"use client"

import { Panel3D } from "./3d-panel"
import { AnimatedNumber } from "./animated-number"
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  CreditCard,
  UtensilsCrossed,
  BarChart3,
} from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalMenuItems: number
  totalRevenue: number
  activeSubscriptions: number
  pendingPayments: number
}

interface DashboardPanel {
  id: string
  title: string
  value: number | string
  prefix?: string
  suffix?: string
  decimals?: number
  icon: React.ComponentType<{ className?: string }>
  glowColor: string
  description: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function Dashboard3DGrid({ stats }: Dashboard3DGridProps) {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null)

  const panels: DashboardPanel[] = [
    {
      id: "users",
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      glowColor: "rgba(59, 130, 246, 0.4)",
      description: "Registered users",
    },
    {
      id: "menu-items",
      title: "Menu Items",
      value: stats.totalMenuItems,
      icon: UtensilsCrossed,
      glowColor: "rgba(168, 85, 247, 0.4)",
      description: "Across all users",
    },
    {
      id: "orders",
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      glowColor: "rgba(34, 197, 94, 0.4)",
      description: "All time orders",
    },
    {
      id: "subscriptions",
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: TrendingUp,
      glowColor: "rgba(249, 115, 22, 0.4)",
      description: "Currently active",
    },
    {
      id: "revenue",
      title: "Total Revenue",
      value: stats.totalRevenue,
      prefix: "€",
      suffix: "",
      decimals: 2,
      icon: DollarSign,
      glowColor: "rgba(16, 185, 129, 0.4)",
      description: "From completed payments",
    },
    {
      id: "payments",
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: CreditCard,
      glowColor: "rgba(239, 68, 68, 0.4)",
      description: "Awaiting approval",
    },
  ]

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 -m-4 lg:-m-6">
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-orange-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Overview of your food business</p>
        </motion.div>

        {/* 3D Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.map((panel, index) => {
            const Icon = panel.icon
            const isExpanded = expandedPanel === panel.id

            return (
              <Panel3D
                key={panel.id}
                delay={index * 0.1}
                glowColor={panel.glowColor}
                expanded={isExpanded}
                onClick={() => setExpandedPanel(isExpanded ? null : panel.id)}
                className={isExpanded ? "md:col-span-2 lg:col-span-2" : ""}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{panel.title}</h3>
                      <p className="text-sm text-gray-400">{panel.description}</p>
                    </div>
                    <div
                      className="p-3 rounded-xl backdrop-blur-sm"
                      style={{ backgroundColor: `${panel.glowColor}20` }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="text-4xl font-bold text-white mb-2">
                      {typeof panel.value === "number" ? (
                        <AnimatedNumber
                          value={panel.value}
                          prefix={panel.prefix || ""}
                          suffix={panel.suffix || ""}
                          decimals={panel.decimals ?? 0}
                        />
                      ) : (
                        panel.value
                      )}
                    </div>

                    {panel.trend && (
                      <div
                        className={`text-sm font-medium flex items-center gap-1 ${
                          panel.trend.isPositive ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        <TrendingUp
                          className={`h-4 w-4 ${
                            panel.trend.isPositive ? "" : "rotate-180"
                          }`}
                        />
                        {panel.trend.isPositive ? "+" : ""}
                        {panel.trend.value}%
                      </div>
                    )}
                  </div>
                </div>
              </Panel3D>
            )
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { title: "Users", icon: Users, color: "rgba(59, 130, 246, 0.4)", href: "/admin/users" },
            {
              title: "Menu Items",
              icon: UtensilsCrossed,
              color: "rgba(168, 85, 247, 0.4)",
              href: "/admin/menu-items",
            },
            {
              title: "Orders",
              icon: ShoppingCart,
              color: "rgba(34, 197, 94, 0.4)",
              href: "/admin/orders",
            },
          ].map((action, index) => {
            const Icon = action.icon
            return (
              <Panel3D
                key={action.title}
                delay={0.7 + index * 0.1}
                glowColor={action.color}
                className="h-32"
              >
                <a href={action.href} className="flex items-center justify-between h-full">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-400">View all {action.title.toLowerCase()}</p>
                  </div>
                  <Icon className="h-8 w-8 text-white opacity-50" />
                </a>
              </Panel3D>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
