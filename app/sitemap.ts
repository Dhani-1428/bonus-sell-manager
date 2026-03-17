import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://bonus-sell-manager.vercel.app").replace(/\/$/, "")
  const now = new Date()

  // Public marketing pages (single-page sections are anchors, so only "/" is needed)
  return [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}

