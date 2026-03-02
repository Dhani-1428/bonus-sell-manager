"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardContainer({ children, className, ...props }: CardContainerProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center [perspective:1000px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div
      className={cn(
        "group/card relative w-full h-full rounded-xl border border-black/10 bg-gray-50 p-4 shadow-sm transition-transform duration-300 ease-out",
        "dark:border-white/20 dark:bg-black",
        "hover:-translate-y-1 hover:shadow-xl",
        "transform-gpu [transform-style:preserve-3d]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  translateZ?: number | string
  as?: React.ElementType
}

export function CardItem({
  children,
  className,
  translateZ = 60,
  as: Component = "div",
  ...props
}: CardItemProps) {
  const style: React.CSSProperties = {
    transform: `translateZ(${typeof translateZ === "number" ? `${translateZ}px` : translateZ})`,
  }

  return (
    <Component
      className={cn(
        "transition-transform duration-300 ease-out",
        "group-hover/card:[transform:translateZ(var(--card-translate-z,60px))]",
        className
      )}
      style={{ "--card-translate-z": style.transform?.replace("translateZ(", "").replace(")", "") } as React.CSSProperties}
      {...props}
    >
      {children}
    </Component>
  )
}

