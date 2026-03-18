import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 lg:flex-row lg:justify-between lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="relative h-16 w-[420px] overflow-hidden rounded-lg bg-transparent">
            <Image
              src="/placeholder-logo.png"
              alt="Bonus Food Sell Manager logo"
              fill
              sizes="420px"
              className="object-contain"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <a href="#about" className="transition-colors hover:text-foreground">About</a>
          <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          <a href="#pricing" className="transition-colors hover:text-foreground">Pricing</a>
          <a href="#contact" className="transition-colors hover:text-foreground">Contact</a>
        </div>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Bonus Food Sell Manager. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
