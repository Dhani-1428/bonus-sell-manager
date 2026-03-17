import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bonus-sell-manager.vercel.app"),
  applicationName: "Bonus Food Sell Manager",
  title: {
    default: "Bonus Food Sell Manager",
    template: "%s | Bonus Food Sell Manager",
  },
  description:
    "Food sell manager for restaurants: manage menu, take orders, track sales, and view reports in one dashboard.",
  keywords: [
    "food sell manager",
    "food sales manager",
    "restaurant sales manager",
    "restaurant management software",
    "restaurant dashboard",
    "order management",
    "menu management",
    "sales reports",
    "admin panel",
    "MB WAY payments",
  ],
  generator: 'v0.app',
  icons: {
    icon: '/placeholder-logo.png',
    shortcut: '/placeholder-logo.png',
    apple: '/placeholder-logo.png',
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Bonus Food Sell Manager",
    description:
      "Food sell manager for restaurants: manage menu, take orders, track sales, and view reports in one dashboard.",
    siteName: "Bonus Food Sell Manager",
    images: [
      {
        url: "/placeholder-logo.png",
        width: 1200,
        height: 630,
        alt: "Bonus Food Sell Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bonus Food Sell Manager",
    description:
      "Food sell manager for restaurants: manage menu, take orders, track sales, and view reports in one dashboard.",
    images: ["/placeholder-logo.png"],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5ff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
