"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, PlusCircle, UtensilsCrossed, BarChart3, Receipt, CreditCard, LogOut } from "lucide-react"
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-order", label: "New Order", icon: PlusCircle },
  { href: "/all-orders", label: "All Orders", icon: Receipt },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
]

export function DashboardSidebar({
  userName,
}: {
  userName: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const links = navItems.map((item) => ({
    label: item.label,
    href: item.href,
    icon: (
      <item.icon className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  }))

  return (
    <Sidebar collapsible="icon">
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {isCollapsed ? <LogoIcon /> : <Logo />}
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
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
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
      href="/dashboard"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
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
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </Link>
  )
}
