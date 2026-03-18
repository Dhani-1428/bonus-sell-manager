"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, LogOut, Shield, Package, ShoppingCart, BarChart3, Calendar } from "lucide-react"
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"

const navItems = [
  { href: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/subscriptions", key: "subscriptions", icon: Calendar },
  { href: "/admin/payments", key: "payments", icon: CreditCard },
  { href: "/admin/analytics", key: "analytics", icon: BarChart3 },
  { href: "/admin/menu-items", key: "menuItems", icon: Package },
  { href: "/admin/orders", key: "orders", icon: ShoppingCart },
]

export function AdminSidebar({
  userName,
}: {
  userName: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { t } = useI18n()

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
      // Redirect to home page instead of admin login
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      // Still redirect even if API call fails
      window.location.href = "/"
    }
  }

  const links = navItems.map((item) => ({
    label: t[item.key as keyof typeof t] || item.key,
    href: item.href,
    icon: (
      <item.icon className="h-5 w-5 shrink-0 text-green-800" />
    ),
  }))

  return (
    <Sidebar collapsible="icon">
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {isCollapsed ? <LogoIcon /> : <Logo />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + "/")
              return (
                <Link key={idx} href={link.href} className="block">
                  <SidebarLink 
                    link={link}
                    className={cn(
                      isActive && "bg-sidebar-primary text-sidebar-primary-foreground"
                    )}
                  />
                </Link>
              )
            })}
          </div>
        </div>
        <div>
          {!isCollapsed && (
            null
          )}
          <SidebarLink
            link={{
              label: userName,
              href: "#",
              icon: (
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  <Shield className="h-4 w-4" />
                </div>
              ),
            }}
          />
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-white text-black transition-colors hover:bg-green-800 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0 text-green-800 group-hover:text-white" />
            {!isCollapsed && <span>{t.logout}</span>}
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  )
}

export const Logo = () => {
  return (
    <Link
      href="/admin/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-white"
      >
        Super Admin
      </motion.span>
    </Link>
  )
}

export const LogoIcon = () => {
  return (
    <Link
      href="/admin/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
    </Link>
  )
}
