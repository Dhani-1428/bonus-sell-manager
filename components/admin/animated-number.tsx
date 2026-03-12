"use client"

import { useEffect, useRef } from "react"
import { useInView } from "framer-motion"
import { motion } from "framer-motion"

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  className?: string
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.5,
  className = "",
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (!isInView || !ref.current) return

    const startValue = 0
    const endValue = value
    const startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentValue = startValue + (endValue - startValue) * easeOut
      ref.current!.textContent = `${prefix}${currentValue.toFixed(decimals)}${suffix}`

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        ref.current!.textContent = `${prefix}${endValue.toFixed(decimals)}${suffix}`
      }
    }

    animate()
  }, [isInView, value, prefix, suffix, decimals, duration])

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {prefix}0{suffix}
    </motion.span>
  )
}
