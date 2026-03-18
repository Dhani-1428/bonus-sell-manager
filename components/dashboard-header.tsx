"use client"

import { LogOut, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useI18n } from "@/lib/i18n/context"

export function DashboardHeader({
  userName,
  onMenuToggle,
  onLogout,
}: {
  userName: string
  onMenuToggle: () => void
  onLogout: () => void
}) {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar bg-sidebar px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-white hover:bg-white/10" />
        <div className="hidden lg:block">
          <p className="text-sm font-medium text-white">{userName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          onClick={onLogout}
          className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          aria-label={t.logout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t.logout}</span>
        </button>
      </div>
    </header>
  )
}
