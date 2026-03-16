"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, LogOut, Shield, Package, ShoppingCart, BarChart3, Calendar } from "lucide-react"
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Calendar },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/menu-items", label: "Menus Of All Users", icon: Package },
  { href: "/admin/orders", label: "All Orders", icon: ShoppingCart },
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
    label: item.label,
    href: item.href,
    icon: (
      <item.icon className="h-5 w-5 shrink-0 text-white" />
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
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-white/10 text-white transition-colors hover:bg-green-500 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0 text-white" />
            {!isCollapsed && <span>Logout</span>}
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
