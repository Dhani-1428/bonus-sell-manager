import { NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const name = body?.name
    const email = body?.email
    const message = body?.message

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await sendContactEmail({
      fromName: String(name),
      fromEmail: String(email),
      message: String(message),
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("Contact email error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to send message" },
      { status: 500 }
    )
  }
}

