"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Send } from "lucide-react"
import { toast } from "sonner"

export function ContactSection() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      toast.error("Please fill in all fields.")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to send message")
      }

      toast.success("Message sent! We'll get back to you within 24 hours.")
      setName("")
      setEmail("")
      setMessage("")
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const waNumber = "351939947595"
  const waHref = `https://wa.me/${waNumber}`

  return (
    <section id="contact" className="scroll-mt-20 px-4 py-20 lg:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Contact</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl text-balance">
            Get in touch
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty lg:text-lg">
            Have a question or want a demo? We{"'"}d love to hear from you.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">bonusfoodsellmanager.com</p>
              </div>
            </div>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                {/* Original WhatsApp brand icon */}
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                  className="h-5 w-5"
                  fill="#25D366"
                >
                  <path d="M380.9 97.1C339 55.2 282.5 32 224.9 32c-127.1 0-230.6 103.5-230.6 230.6 0 40.6 10.6 81.5 30.1 117.1L0 480l100.9-33.8c35.2 18.8 74 28.8 114 28.8h.1c127.1 0 230.6-103.5 230.6-230.6 0-61.7-24-119.7-67-162.3zM224.9 446c-35.8 0-70.7-9.6-101.1-27.8l-7.2-4.2-56.6 18.9 18.9-55.9-4.6-7.4C44.9 322 35 287.2 35 261.6 35 152.4 120.6 66.8 229.8 66.8c52.3 0 101.7 20.4 138.9 57.5 37.2 37.2 57.6 86.5 57.6 138.8C426.3 360.4 340.7 446 231.5 446h-6.6zM291.2 308.2c-3.4-1.7-20.4-10.1-23.6-11.2-3.2-1.1-5.6-1.7-7.9 1.7-2.3 3.4-9.2 11.2-11.3 13.5-2.1 2.3-4.1 2.7-7.5 1-3.4-1.7-14.3-5.3-27.3-16.9-10.1-9-16.9-20.2-18.9-23.6-2-3.4-.2-5.2 1.5-6.9 1.4-1.4 3.2-3.4 4.8-5.1 1.6-1.7 2.1-3.4 3.2-5.6 1.1-2.1.6-4 0-5.6-.6-1.7-7.9-24-10.9-33-2.9-8.7-5.8-7.5-8.1-7.6-2.1-.1-4.5-.1-6.9-.1-2.4 0-6.2.9-9.4 4.5-3.2 3.6-12.3 12.1-12.3 29.6 0 17.5 12.6 34.4 14.3 36.5 1.7 2.1 24.2 38.6 58.7 54.2 8.2 3.7 14.6 5.9 19.7 7.5 8.3 2.6 15.9 2.2 21.8 1.3 6.6-1 20.4-8.3 23.3-16.3 2.9-8 2.9-14.8 2-16.3-.9-1.5-3.2-2.3-6.6-3.9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                <p className="text-sm text-muted-foreground">+351 939947595</p>
              </div>
            </a>
            <div className="mt-4 rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-semibold text-card-foreground">Response Time</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                We typically respond within 24 hours on business days. For urgent issues, premium support users are prioritized.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-name" className="text-sm font-medium">Name</Label>
                <Input
                  id="contact-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="contact-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-message" className="text-sm font-medium">Message</Label>
              <textarea
                id="contact-message"
                rows={5}
                placeholder="Tell us about your restaurant or ask us anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
