"use client"

import { Star } from "lucide-react"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"

const testimonials = [
  {
    name: "Marco R.",
    role: "Owner, Trattoria Bella",
    quote:
      "Bonus Food Sell Manager replaced our entire spreadsheet system in one afternoon. I can finally see which dishes actually make money.",
    stars: 5,
  },
  {
    name: "Sophie L.",
    role: "Manager, Le Petit Bistro",
    quote:
      "The order entry is lightning fast. Our staff picked it up in minutes. Reports save me hours every week on bookkeeping.",
    stars: 5,
  },
  {
    name: "Kenji T.",
    role: "Head Chef, Sakura Kitchen",
    quote:
      "I love the menu management. I can tweak prices and add seasonal specials in seconds. The dashboard is beautiful and easy to read.",
    stars: 5,
  },
  {
    name: "Elena V.",
    role: "Owner, Cafe Mornings",
    quote:
      "We have three locations and each manager has their own panel. The best-seller reports helped us cut underperforming items and boost revenue by 18%.",
    stars: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="scroll-mt-20 px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Testimonials</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl text-balance">
            Loved by restaurants everywhere
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty lg:text-lg">
            Hear from real restaurant owners and managers who use Bonus Food Sell Manager every day.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((t) => (
            <CardContainer key={t.name} className="inter-var">
              <CardBody className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 dark:bg-black dark:border-white/[0.2]">
                <CardItem translateZ="50" className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-chart-3 text-chart-3" />
                  ))}
                </CardItem>
                <CardItem translateZ="60" as="p" className="text-sm text-card-foreground leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </CardItem>
                <CardItem translateZ="70" className="mt-auto flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </div>
    </section>
  )
}
