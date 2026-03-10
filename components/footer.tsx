export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 lg:flex-row lg:justify-between lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
              <path d="M3 11h18v6a4 4 0 01-4 4H7a4 4 0 01-4-4v-6z" />
              <path d="M2 11h20" />
              <path d="M8 7c0-2 1-3 4-3s4 1 4 3" />
            </svg>
          </div>
          <span className="text-sm font-bold text-foreground">Bonus Food Sell Manager</span>
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
