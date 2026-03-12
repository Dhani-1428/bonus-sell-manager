"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface Panel3DProps {
  children: React.ReactNode
  className?: string
  delay?: number
  glowColor?: string
  onClick?: () => void
  expanded?: boolean
}

export function Panel3D({
  children,
  className,
  delay = 0,
  glowColor = "rgba(34, 197, 94, 0.3)",
  onClick,
  expanded = false,
}: Panel3DProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn("relative cursor-pointer", className)}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: expanded ? 1.05 : 1,
        z: expanded ? 50 : 0,
      }}
      transition={{
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl blur-xl opacity-0 transition-opacity duration-500"
        style={{
          background: glowColor,
          opacity: isHovered ? 0.6 : 0,
        }}
      />

      {/* Glass panel */}
      <motion.div
        className="relative h-full w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl"
        style={{
          transformStyle: "preserve-3d",
          boxShadow: isHovered
            ? `0 20px 40px -10px ${glowColor}, 0 0 0 1px rgba(255, 255, 255, 0.1)`
            : "0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative p-6 h-full" style={{ transform: "translateZ(20px)" }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}
