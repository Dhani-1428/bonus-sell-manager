"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { LayoutDashboard, PlusCircle, UtensilsCrossed, BarChart3, Receipt, CreditCard, LogOut, Settings } from "lucide-react"
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { getRestaurantSettings } from "@/lib/api-store"
import { useI18n } from "@/lib/i18n/context"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-order", label: "New Order", icon: PlusCircle },
  { href: "/all-orders", label: "All Orders", icon: Receipt },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar({
  userName,
}: {
  userName: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, session } = useAuth()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { t } = useI18n()
  const [restaurantName, setRestaurantName] = useState<string | null>(null)

  useEffect(() => {
    const loadRestaurantName = async () => {
      if (session?.userId) {
        try {
          const settings = await getRestaurantSettings(session.userId)
          if (settings?.name) {
            setRestaurantName(settings.name)
          }
        } catch (error) {
          console.error("Failed to load restaurant name:", error)
        }
      }
    }
    loadRestaurantName()
  }, [session?.userId])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const links = navItems.map((item) => ({
    // Translate the most important labels (others will remain in English).
    label:
      item.href === "/dashboard"
        ? t.dashboard
        : item.href === "/all-orders"
          ? t.orders
          : item.href === "/menu"
            ? t.menuItems
            : item.href === "/reports"
              ? t.analytics
              : item.href === "/subscription"
                ? t.subscriptions
                : item.label,
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
          {restaurantName && !isCollapsed && (
            <div className="mt-6 px-3">
              <p className="text-sm font-semibold text-black truncate">{restaurantName}</p>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => {
              const isActive = pathname === link.href
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
                  {userName.charAt(0).toUpperCase()}
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
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-white"
      >
        Bonus Food Sell Manager
      </motion.span>
    </Link>
  )
}

export const LogoIcon = () => {
  return (
    <Link
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
    </Link>
  )
}
