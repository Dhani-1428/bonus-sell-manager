import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Convert file to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = imageFile.type || "image/jpeg"

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      // Fallback: Return error with instructions
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          message: "Please set OPENAI_API_KEY in your environment variables",
        },
        { status: 500 }
      )
    }

    // Call OpenAI Vision API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // or "gpt-4-vision-preview" for older models
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this restaurant menu image and extract ALL menu items with their prices.

IMPORTANT INSTRUCTIONS:
1. Extract ONLY food/drink items with prices - ignore logos, phone numbers, addresses, delivery info, decorative text, and disclaimers
2. For each item, provide: name (exact as shown), price (number only, no currency symbol), and category
3. Categories should be one of: "Main", "Starter", "Dessert", or "Beverage"
4. If an item has multiple sizes/prices (e.g., Medium/Grande), extract each size as a separate item with the size in the name
5. Return ONLY valid JSON array in this exact format:
[
  { "name": "Item Name", "price": 12.50, "category": "Main" },
  { "name": "Another Item", "price": 8.99, "category": "Starter" }
]

Return ONLY the JSON array, no other text or explanation.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for more consistent results
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("OpenAI API Error:", errorData)
      return NextResponse.json(
        { error: "Failed to process image with AI", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 })
    }

    // Parse JSON from response (might have markdown code blocks)
    let jsonText = content.trim()
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/^```json\n?/i, "").replace(/^```\n?/i, "").replace(/\n?```$/i, "")
    jsonText = jsonText.trim()

    try {
      const menuItems = JSON.parse(jsonText)
      
      // Validate and clean the response
      if (!Array.isArray(menuItems)) {
        return NextResponse.json(
          { error: "Invalid response format from AI" },
          { status: 500 }
        )
      }

      // Validate each item
      const validItems = menuItems
        .filter((item: any) => {
          return (
            item &&
            typeof item.name === "string" &&
            item.name.length >= 2 &&
            typeof item.price === "number" &&
            item.price > 0 &&
            item.price < 1000 &&
            ["Main", "Starter", "Dessert", "Beverage"].includes(item.category)
          )
        })
        .map((item: any) => ({
          name: item.name.trim(),
          price: Math.round(item.price * 100) / 100,
          category: item.category,
        }))

      return NextResponse.json({ items: validItems })
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Content:", jsonText)
      return NextResponse.json(
        { error: "Failed to parse AI response", rawContent: jsonText },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    )
  }
}
