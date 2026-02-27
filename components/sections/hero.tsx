import { ArrowRight, ChefHat } from "lucide-react"

export function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 pt-16">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        {/* Badge */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <ChefHat className="h-4 w-4 text-primary" />
          <span>Restaurant Sales Management Made Simple</span>
        </div>

        <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
          Run Your Restaurant
          <br />
          <span className="text-primary">Smarter, Not Harder</span>
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground text-pretty lg:text-xl">
          Track every order, manage your menu in real time, and get instant reports that help you make better business decisions. All from one dashboard.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={onGetStarted}
            className="group flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <a
            href="#features"
            className="flex h-12 items-center rounded-lg border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-accent"
          >
            See How It Works
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-8 lg:gap-16">
          {[
            { value: "2,400+", label: "Restaurants" },
            { value: "1.2M+", label: "Orders Tracked" },
            { value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-foreground lg:text-3xl">{stat.value}</span>
              <span className="text-xs text-muted-foreground lg:text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
