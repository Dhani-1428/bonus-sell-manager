import { BarChart3, Clock, Shield } from "lucide-react"

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-border bg-card px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">About SalesRocket</p>
          <h2 className="text-3xl font-bold tracking-tight text-card-foreground lg:text-4xl text-balance">
            Built by restaurant owners, for restaurant owners
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty lg:text-lg">
            We know the chaos of running a busy kitchen. SalesRocket was born out of frustration with complicated POS systems and messy spreadsheets. Our goal is one thing: make your sales data work for you, not against you.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Save Hours Every Week",
              description:
                "Stop manually tallying receipts. Every order is automatically logged, categorized, and ready for review in your dashboard.",
            },
            {
              icon: BarChart3,
              title: "Data-Driven Decisions",
              description:
                "See your top sellers, peak hours, and revenue trends at a glance. Real insights that help you stock smarter and staff better.",
            },
            {
              icon: Shield,
              title: "Secure & Private",
              description:
                "Your restaurant data stays yours. Fully encrypted accounts with isolated storage for every user. No third-party data sharing.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-4 rounded-xl border border-border bg-background p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
