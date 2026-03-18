"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useI18n } from "@/lib/i18n/context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function SettingsPage() {
  const { session } = useAuth()
  const { t } = useI18n()

  const [profile, setProfile] = useState<{ name: string; email: string }>({ name: "", email: "" })
  const [restaurantSettings, setRestaurantSettings] = useState<{ name: string; address: string; contactNumber: string }>({
    name: "",
    address: "",
    contactNumber: "",
  })

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingRestaurant, setSavingRestaurant] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [resettingPassword, setResettingPassword] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!session) return

      setLoading(true)
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch("/api/auth/profile", { method: "GET" }),
          fetch(`/api/users/${session.userId}/settings`, { method: "GET" }),
        ])

        if (!profileRes.ok) {
          throw new Error("Failed to load profile")
        }
        if (!settingsRes.ok) {
          throw new Error("Failed to load restaurant settings")
        }

        const profileData = await profileRes.json()
        const settingsData = await settingsRes.json()

        setProfile({
          name: profileData?.name || session.name || "",
          email: profileData?.email || session.email || "",
        })

        const s = settingsData?.settings
        setRestaurantSettings({
          name: s?.name || session.name || "",
          address: s?.address || "",
          contactNumber: s?.contactNumber || "",
        })
      } catch (err: any) {
        console.error("Settings load error:", err)
        toast.error(err?.message || "Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [session])

  const saveProfile = async () => {
    if (!session) return
    setSavingProfile(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile")
      }
      toast.success("Profile updated")
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  const saveRestaurant = async () => {
    if (!session) return
    setSavingRestaurant(true)
    try {
      const res = await fetch(`/api/users/${session.userId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurantSettings),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to update restaurant settings")
      }
      toast.success("Restaurant details updated")
    } catch (err: any) {
      toast.error(err?.message || "Failed to update restaurant details")
    } finally {
      setSavingRestaurant(false)
    }
  }

  const handleResetPassword = async () => {
    if (!session) return
    setResettingPassword(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password")
      }
      setCurrentPassword("")
      setNewPassword("")
      toast.success("Password updated successfully")
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset password")
    } finally {
      setResettingPassword(false)
    }
  }

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">{t.loadingSettings}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">{t.settingsTitle}</h1>
        <p className="text-sm text-gray-600">{t.settingsPageDescription}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">{t.accountDetailsTitle}</CardTitle>
            <CardDescription>{t.accountDetailsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">{t.nameLabel}</Label>
              <Input
                id="profile-name"
                  className="bg-white text-black border border-gray-300 placeholder:text-gray-400"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">{t.emailLabel}</Label>
              <Input
                id="profile-email"
                type="email"
                  className="bg-white text-black border border-gray-300 placeholder:text-gray-400"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <Button
              onClick={saveProfile}
              disabled={savingProfile}
              className="w-full bg-green-800 text-white hover:bg-green-900"
            >
              {savingProfile ? t.savingProfile : t.saveDetails}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">{t.restaurantDetailsTitle}</CardTitle>
            <CardDescription>{t.restaurantDetailsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rest-name">{t.restaurantNameLabel}</Label>
              <Input
                id="rest-name"
                  className="bg-white text-black border border-gray-300 placeholder:text-gray-400"
                value={restaurantSettings.name}
                onChange={(e) => setRestaurantSettings((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-address">{t.addressLabel}</Label>
              <Input
                id="rest-address"
                  className="bg-white text-black border border-gray-300 placeholder:text-gray-400"
                value={restaurantSettings.address}
                onChange={(e) => setRestaurantSettings((s) => ({ ...s, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-contact">{t.contactNumberLabel}</Label>
              <Input
                id="rest-contact"
                  className="bg-white text-black border border-gray-300 placeholder:text-gray-400"
                value={restaurantSettings.contactNumber}
                onChange={(e) => setRestaurantSettings((s) => ({ ...s, contactNumber: e.target.value }))}
              />
            </div>
            <Button
              onClick={saveRestaurant}
              disabled={savingRestaurant}
              className="w-full bg-green-800 text-white hover:bg-green-900"
            >
              {savingRestaurant ? t.savingRestaurant : t.saveRestaurantDetails}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-black">{t.resetPasswordTitle}</CardTitle>
            <CardDescription>{t.resetPasswordDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t.currentPasswordLabel}</Label>
              <Input
                id="current-password"
                type="password"
                  className="bg-white text-black border border-gray-300 placeholder:text-gray-400"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t.newPasswordLabel}</Label>
              <Input
                id="new-password"
                type="password"
                className="bg-white text-black border border-gray-300 placeholder:text-gray-400"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="w-full bg-green-800 text-white hover:bg-green-900"
            >
              {resettingPassword ? t.updatingPassword : t.updatePassword}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

