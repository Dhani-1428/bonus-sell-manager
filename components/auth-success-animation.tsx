"use client"

import { useEffect, useState } from "react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { useTheme } from "next-themes"

interface AuthSuccessAnimationProps {
  onComplete: () => void
}

export function AuthSuccessAnimation({ onComplete }: AuthSuccessAnimationProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (animationComplete) {
      // Wait a bit after animation completes before redirecting
      const timer = setTimeout(() => {
        onComplete()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [animationComplete, onComplete])

  // Determine if we're in dark mode
  const isDarkMode = mounted && (resolvedTheme === "dark" || theme === "dark")

  if (!mounted) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <DotLottieReact
            src="https://lottie.host/15c474d3-1791-4d25-914a-b8240d759ee9/648fdsox3i.lottie"
            loop={false}
            autoplay={true}
            onComplete={() => {
              setAnimationComplete(true)
            }}
            className={isDarkMode ? "dark-mode" : "light-mode"}
          />
        </div>
      </div>
    </div>
  )
}
