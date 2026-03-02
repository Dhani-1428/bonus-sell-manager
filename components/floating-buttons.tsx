"use client"

import { useState, useEffect } from "react"
import { MessageCircle, ArrowUp } from "lucide-react"

export function FloatingButtons() {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const whatsappNumber = "+351939947595"

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hello! I'm interested in SalesRocket.")
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* WhatsApp Button */}
      <button
        onClick={handleWhatsAppClick}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
        aria-label="Contact us on WhatsApp"
        title="Chat on WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </button>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={handleBackToTop}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
