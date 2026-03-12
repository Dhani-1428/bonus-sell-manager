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

        {/* 3D Grid - Unique Panel Designs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {panels.map((panel, index) => {
            const Icon = panel.icon
            const isExpanded = expandedPanel === panel.id

            // Different styles for each panel
            const panelStyles = [
              {
                // Users - Minimal Glass
                bg: "bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent",
                border: "border-blue-400/20",
                iconBg: "bg-blue-500/20",
                iconBorder: "border-blue-400/30",
              },
              {
                // Menu Items - Purple Gradient
                bg: "bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-pink-500/10",
                border: "border-purple-400/30",
                iconBg: "bg-gradient-to-br from-purple-500/30 to-pink-500/20",
                iconBorder: "border-purple-400/40",
              },
              {
                // Orders - Green Neon
                bg: "bg-gradient-to-br from-green-500/15 via-emerald-500/10 to-transparent",
                border: "border-green-400/25",
                iconBg: "bg-green-500/25",
                iconBorder: "border-green-400/35",
                glow: true,
              },
              {
                // Subscriptions - Orange Warm
                bg: "bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-yellow-500/5",
                border: "border-orange-400/30",
                iconBg: "bg-gradient-to-br from-orange-500/30 to-amber-500/20",
                iconBorder: "border-orange-400/40",
              },
              {
                // Revenue - Emerald Shine
                bg: "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/5",
                border: "border-emerald-400/30",
                iconBg: "bg-emerald-500/30",
                iconBorder: "border-emerald-400/40",
                shine: true,
              },
              {
                // Payments - Red Alert
                bg: "bg-gradient-to-br from-rose-500/20 via-red-500/10 to-pink-500/5",
                border: "border-rose-400/30",
                iconBg: "bg-rose-500/30",
                iconBorder: "border-rose-400/40",
                pulse: true,
              },
            ]

            const style = panelStyles[index % panelStyles.length]

            return (
              <motion.div
                key={panel.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isExpanded ? 1.05 : 1,
                }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                className={`relative group cursor-pointer ${
                  isExpanded ? "md:col-span-2 lg:col-span-2" : ""
                }`}
                onClick={() => setExpandedPanel(isExpanded ? null : panel.id)}
              >
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                  style={{ background: panel.glowColor }}
                />

                {/* Main panel */}
                <div
                  className={`relative h-full w-full rounded-2xl border-2 ${style.border} ${style.bg} backdrop-blur-xl shadow-2xl overflow-hidden`}
                  style={{
                    boxShadow: `0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 40px ${panel.glowColor}`,
                  }}
                >
                  {/* Animated background pattern */}
                  {style.shine && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}

                  {/* Pulse effect for payments */}
                  {style.pulse && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-rose-400/50"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  )}

                  {/* Content */}
                  <div className="relative p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                          {panel.title}
                          {index === 2 && (
                            <motion.span
                              className="text-xs bg-green-500/30 px-2 py-1 rounded-full text-green-300"
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              NEW
                            </motion.span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-300">{panel.description}</p>
                      </div>
                      <motion.div
                        className={`p-4 rounded-xl border ${style.iconBorder} ${style.iconBg} backdrop-blur-sm`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </motion.div>
                    </div>

                    <div className="mt-auto">
                      <div className="text-5xl font-bold text-white mb-3 tracking-tight">
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

                      {/* Decorative element */}
                      {index === 4 && (
                        <motion.div
                          className="mt-3 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ delay: 1, duration: 1 }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Quick Actions - Unique Designs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Users Card - Gradient Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
            className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => window.location.href = "/admin/users"}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDEuMTA0LS44OTYgMi0yIDJIMjZjLTEuMTA0IDAtMi0uODk2LTItMnYtM2MwLTMuMzE0IDIuNjg2LTYgNi02czYgMi42ODYgNiA2djN6bTEwLTExYzAgMy4zMTQtMi42ODYgNi02IDZzLTYtMi42ODYtNi02IDIuNjg2LTYgNi02IDYgMi42ODYgNiA2eiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMSIvPjwvZz48L3N2Zz4=')] opacity-20" />
            <div className="relative h-full p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Users</h3>
                  <p className="text-blue-100 text-sm">Manage all user accounts</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <span>View All Users</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Menu Items Card - Glassmorphism Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
            className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer border-2 border-purple-500/30"
            onClick={() => window.location.href = "/admin/menu-items"}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-pink-900/40 backdrop-blur-xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative h-full p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Menu Items</h3>
                  <p className="text-purple-200 text-sm">View all menu items</p>
                </div>
                <div className="bg-purple-500/30 backdrop-blur-md p-3 rounded-xl border border-purple-400/30 group-hover:bg-purple-500/40 transition-colors">
                  <UtensilsCrossed className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <span>View All Menus</span>
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Orders Card - Neon Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, type: "spring", stiffness: 100 }}
            className="group relative h-40 rounded-2xl overflow-hidden cursor-pointer"
            onClick={() => window.location.href = "/admin/orders"}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-500" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,.1)_50%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <motion.div
              className="absolute inset-0 border-2 border-green-400 rounded-2xl"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(34, 197, 94, 0.5)",
                  "0 0 40px rgba(34, 197, 94, 0.8)",
                  "0 0 20px rgba(34, 197, 94, 0.5)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative h-full p-6 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Orders</h3>
                  <p className="text-green-100 text-sm">View all orders</p>
                </div>
                <motion.div
                  className="bg-white/20 backdrop-blur-sm p-3 rounded-xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ShoppingCart className="h-8 w-8 text-white" />
                </motion.div>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <span>View All Orders</span>
                <motion.span
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  →
                </motion.span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
