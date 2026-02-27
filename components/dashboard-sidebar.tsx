"use client"

import Link from "next/link"
import { LayoutDashboard, PlusCircle, UtensilsCrossed, BarChart3, Receipt, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-order", label: "New Order", icon: PlusCircle },
  { href: "/all-orders", label: "All Orders", icon: Receipt },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/reports", label: "Reports", icon: BarChart3 },
]

export function DashboardSidebar({
  isOpen,
  onClose,
  pathname,
  userName,
}: {
  isOpen: boolean
  onClose: () => void
  pathname: string
  userName: string
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <svg width="16" height="20" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C16 0 8 10 8 20H24C24 10 16 0 16 0Z" className="fill-sidebar-primary-foreground" />
              <rect x="8" y="20" width="16" height="12" className="fill-sidebar-primary-foreground/80" />
              <path d="M8 26L2 34L8 32Z" className="fill-sidebar-primary-foreground/60" />
              <path d="M24 26L30 34L24 32Z" className="fill-sidebar-primary-foreground/60" />
            </svg>
          </div>
          <span className="text-sm font-bold text-sidebar-foreground">SalesRocket</span>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Restaurant name */}
      <div className="px-4 py-3">
        <p className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">Restaurant</p>
        <p className="mt-0.5 text-sm font-semibold text-sidebar-foreground truncate">{userName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <p className="text-xs text-sidebar-foreground/40 text-center">SalesRocket v1.0</p>
      </div>
    </aside>
  )
}
