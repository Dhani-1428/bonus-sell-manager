"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Is there a free trial?",
    answer:
      "Yes! When you create an account, you get full access to all features with sample data pre-loaded so you can explore the dashboard, create orders, and generate reports right away.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. SalesRocket runs entirely in your browser. Just sign up, log in, and start managing your sales from any device - phone, tablet, or desktop.",
  },
  {
    question: "Can I use it for multiple restaurants?",
    answer:
      "Absolutely. Each account has its own isolated admin panel. You can create separate accounts for each location, or with the 12-month plan you get unlimited user accounts.",
  },
  {
    question: "How do I export my data?",
    answer:
      "The Reports page has a one-click CSV export button. You can filter by date range first, then download your orders with all details for bookkeeping or tax purposes.",
  },
  {
    question: "What payment methods are supported for the subscription?",
    answer:
      "We accept all major credit cards, debit cards, and PayPal. All payments are processed securely with SSL encryption.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. You will continue to have access until the end of your current billing period.",
  },
]

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="scroll-mt-20 border-t border-border bg-card px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">FAQ</p>
          <h2 className="text-3xl font-bold tracking-tight text-card-foreground lg:text-4xl text-balance">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty lg:text-lg">
            Everything you need to know about SalesRocket.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-background"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={openIndex === index}
              >
                <span className="text-sm font-semibold text-foreground">{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
