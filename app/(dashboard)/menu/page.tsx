"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, saveMenuItems } from "@/lib/api-store"
import type { MenuItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Loader2, Trash } from "lucide-react"
import { HoverEffect } from "@/components/ui/card-hover-effect"
import { toast } from "sonner"
import { createWorker } from "tesseract.js"
import { FileUpload } from "@/components/ui/file-upload"

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const categories = ["Main", "Starter", "Dessert", "Beverage"]

export default function MenuPage() {
  const { session } = useAuth()
  const [items, setItems] = useState<MenuItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("Main")
  const [extras, setExtras] = useState<Array<{ name: string; price: string }>>([])
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedItems, setExtractedItems] = useState<Array<{ name: string; price: number; category: string; description?: string }>>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [ocrConfidence, setOcrConfidence] = useState<number>(0)
  const [processingStep, setProcessingStep] = useState<string>("")

  const [isLoading, setIsLoading] = useState(false)

  // Load items when session changes - fetch from database
  useEffect(() => {
    const loadItems = async () => {
      if (session) {
        setIsLoading(true)
        try {
          const fetchedItems = await getMenuItems(session.userId)
          setItems(fetchedItems)
        } catch (error) {
          console.error("Error loading menu items:", error)
          toast.error("Failed to load menu items")
        } finally {
          setIsLoading(false)
        }
      } else {
        setItems([])
      }
    }
    loadItems()
  }, [session])

  const refreshItems = useCallback(async () => {
    if (session) {
      try {
        const fetchedItems = await getMenuItems(session.userId)
        setItems(fetchedItems)
      } catch (error) {
        console.error("Error refreshing menu items:", error)
        toast.error("Failed to refresh menu items")
      }
    }
  }, [session])

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {}
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [items])

  const openAdd = () => {
    // Close OCR dialog if open to prevent conflicts
    if (ocrDialogOpen) {
      setOcrDialogOpen(false)
      setExtractedItems([])
      setImagePreview(null)
    }
    setEditingItem(null)
    setName("")
    setPrice("")
    setCategory("Main")
    setExtras([])
    setDialogOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setName(item.name)
    setPrice(item.price.toString())
    setCategory(item.category)
    setExtras(item.extras ? item.extras.map(e => ({ name: e.name, price: e.price.toString() })) : [])
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!session) return
    if (!name.trim() || !price) {
      toast.error("Please fill in all fields")
      return
    }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price")
      return
    }

    // Validate extras if provided
    const validExtras = extras
      .filter(e => e.name.trim() && e.price.trim())
      .map(e => ({
        name: e.name.trim(),
        price: parseFloat(e.price)
      }))
      .filter(e => !isNaN(e.price) && e.price >= 0)

    const menuItemData: any = {
      name: name.trim(),
      price: priceNum,
      category
    }

    if (validExtras.length > 0) {
      menuItemData.extras = validExtras
    }

    try {
      if (editingItem) {
        const updatedItem = await updateMenuItem(session.userId, editingItem.id, menuItemData)
        if (!updatedItem) {
          toast.error("Failed to update menu item - item not found")
          return
        }
        toast.success("Menu item updated!")
      } else {
        const newItem = await addMenuItem(session.userId, menuItemData)
        console.log("✅ Menu item added via UI:", newItem)
        toast.success("Menu item added!")
      }
      // Wait a bit for database to update, then refresh
      await new Promise(resolve => setTimeout(resolve, 500))
      await refreshItems()
      setDialogOpen(false)
    } catch (error: any) {
      console.error("❌ Error saving menu item:", error)
      console.error("Error details:", {
        message: error.message,
        userId: session.userId,
        itemData: menuItemData,
      })
      toast.error(`Failed to save menu item: ${error.message || "Unknown error"}`)
    }
  }

  const addExtra = () => {
    setExtras([...extras, { name: "", price: "" }])
  }

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index))
  }

  const updateExtra = (index: number, field: "name" | "price", value: string) => {
    setExtras(extras.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  const handleDelete = async (id: string) => {
    if (!session) return
    try {
      const success = await deleteMenuItem(session.userId, id)
      if (success) {
        toast.success("Menu item deleted")
        await refreshItems()
      } else {
        toast.error("Failed to delete menu item")
      }
    } catch (error) {
      console.error("Error deleting menu item:", error)
      toast.error("Failed to delete menu item")
    }
    setDeleteConfirm(null)
  }

  const handleDeleteAll = async () => {
    if (!session) return
    try {
      await saveMenuItems(session.userId, [])
      toast.success("All menu items deleted")
      await refreshItems()
    } catch (error) {
      console.error("Error deleting all menu items:", error)
      toast.error("Failed to delete all menu items")
    }
    setDeleteAllConfirm(false)
  }

  // Advanced image preprocessing: multiple enhancement techniques
  const preprocessImage = async (file: File): Promise<File[]> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const enhancedFiles: File[] = []
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve([file]) // Fallback to original if canvas not available
          return
        }

        // Set canvas size (scale up for better OCR - 2x resolution)
        const scale = 2
        canvas.width = img.width * scale
        canvas.height = img.height * scale

        // Draw image scaled up
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Strategy 1: High contrast + brightness (for dark menus)
        const strategy1 = document.createElement("canvas")
        const ctx1 = strategy1.getContext("2d")
        if (ctx1) {
          strategy1.width = canvas.width
          strategy1.height = canvas.height
          ctx1.drawImage(canvas, 0, 0)
          const imageData1 = ctx1.getImageData(0, 0, strategy1.width, strategy1.height)
          const data1 = imageData1.data

          for (let i = 0; i < data1.length; i += 4) {
            // High contrast
            const contrast = 1.5
            data1[i] = Math.min(255, Math.max(0, ((data1[i] - 128) * contrast) + 128))
            data1[i + 1] = Math.min(255, Math.max(0, ((data1[i + 1] - 128) * contrast) + 128))
            data1[i + 2] = Math.min(255, Math.max(0, ((data1[i + 2] - 128) * contrast) + 128))
            
            // Brightness
            const brightness = 20
            data1[i] = Math.min(255, data1[i] + brightness)
            data1[i + 1] = Math.min(255, data1[i + 1] + brightness)
            data1[i + 2] = Math.min(255, data1[i + 2] + brightness)
          }
          ctx1.putImageData(imageData1, 0, 0)
        }

        // Strategy 2: Grayscale with high contrast (better for text)
        const strategy2 = document.createElement("canvas")
        const ctx2 = strategy2.getContext("2d")
        if (ctx2) {
          strategy2.width = canvas.width
          strategy2.height = canvas.height
          ctx2.drawImage(canvas, 0, 0)
          const imageData2 = ctx2.getImageData(0, 0, strategy2.width, strategy2.height)
          const data2 = imageData2.data

          for (let i = 0; i < data2.length; i += 4) {
            // Convert to grayscale
            const gray = data2[i] * 0.299 + data2[i + 1] * 0.587 + data2[i + 2] * 0.114
            
            // High contrast grayscale
            const contrast = 2.0
            const enhanced = Math.min(255, Math.max(0, ((gray - 128) * contrast) + 128))
            
            data2[i] = enhanced
            data2[i + 1] = enhanced
            data2[i + 2] = enhanced
          }
          ctx2.putImageData(imageData2, 0, 0)
        }

        // Convert all strategies to files
        const promises: Promise<void>[] = []

        if (ctx1) {
          promises.push(
            new Promise((resolveBlob) => {
              strategy1.toBlob((blob) => {
                if (blob) enhancedFiles.push(new File([blob], "enhanced1.jpg", { type: "image/jpeg" }))
                resolveBlob()
              }, "image/jpeg", 0.95)
            })
          )
        }

        if (ctx2) {
          promises.push(
            new Promise((resolveBlob) => {
              strategy2.toBlob((blob) => {
                if (blob) enhancedFiles.push(new File([blob], "enhanced2.jpg", { type: "image/jpeg" }))
                resolveBlob()
              }, "image/jpeg", 0.95)
            })
          )
        }

        // Strategy 3: Original scaled (fallback)
        promises.push(
          new Promise((resolveBlob) => {
            canvas.toBlob((blob) => {
              if (blob) {
                enhancedFiles.push(new File([blob], "enhanced3.jpg", { type: "image/jpeg" }))
              }
              resolveBlob()
            }, "image/jpeg", 0.95)
          })
        )

        // Wait for all strategies to complete
        Promise.all(promises).then(() => {
          resolve(enhancedFiles.length > 0 ? enhancedFiles : [file])
        })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // Fix only very obvious OCR errors (conservative approach to preserve accuracy)
  const fixCommonOCRErrors = (text: string): string => {
    return text
      // Only fix very obvious character misreads in common menu words
      .replace(/\bP1zza\b/gi, "Pizza")
      .replace(/\bPizz@\b/gi, "Pizza")
      .replace(/\bKeb@b\b/gi, "Kebab")
      .replace(/\bFrang0\b/gi, "Frango")
      .replace(/\bQueij0\b/gi, "Queijo")
      .replace(/\bBocadill0s\b/gi, "Bocadillos")
      // Preserve everything else as-is to maintain OCR accuracy
  }

  // AI Vision menu extraction using OpenAI Vision API
  const extractMenuWithAI = async (file: File): Promise<Array<{ name: string; price: number; category: string; description?: string }>> => {
    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("/api/extract-menu", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error Response:", errorData)
        
        if (errorData.error === "OpenAI API key not configured" || errorData.error?.includes("API key")) {
          throw new Error("AI vision not configured. Please set OPENAI_API_KEY in .env.local and restart the dev server.")
        }
        
        // Show more detailed error message
        const errorMessage = errorData.error || errorData.message || "Failed to extract menu with AI"
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data.items || []
    } catch (error: any) {
      console.error("AI Vision Error:", error)
      throw error
    }
  }

  // Intelligent text correction for common OCR errors
  const correctOCRText = (text: string): string => {
    // Common OCR character misreads
    const corrections: Record<string, string> = {
      // Numbers misread as letters
      "0": "O", // Context-dependent, but common in menu names
      "1": "I", // In certain contexts
      "5": "S", // Less common but happens
      // Letters misread
      "rn": "m",
      "vv": "w",
      "cl": "d",
      // Common menu word fixes
      "P1zza": "Pizza",
      "Pizz@": "Pizza",
      "PizzaBE": "Pizza",
      "Pizza Espe": "Pizza Especial",
      "Keb@b": "Kebab",
      "Frang0": "Frango",
      "Queij0": "Queijo",
      "Bocadill0s": "Bocadillos",
      "Bocadill0": "Bocadillo",
      "Hambúrguer": "Hambúrguer",
      "Hamburguer": "Hambúrguer",
    }

    let corrected = text
    for (const [wrong, correct] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(wrong, "gi"), correct)
    }

    return corrected
  }

  // Advanced menu item pattern recognition
  const recognizeMenuItemPattern = (line: string): { name: string; price: number; description?: string } | null => {
    // Pattern 1: "Item Name 3,50€" or "Item Name €3,50"
    const pattern1 = /^(.+?)\s+([€$£₹]?\s*\d+[,\.]\d{2}\s*[€$£₹]?)$/
    // Pattern 2: "Item Name - 3,50€"
    const pattern2 = /^(.+?)\s*[-–—]\s*([€$£₹]?\s*\d+[,\.]\d{2}\s*[€$£₹]?)$/
    // Pattern 3: "Item Name (Description) 3,50€"
    const pattern3 = /^(.+?)\s*\(([^)]+)\)\s*([€$£₹]?\s*\d+[,\.]\d{2}\s*[€$£₹]?)$/

    let match = line.match(pattern3)
    if (match) {
      const name = match[1].trim()
      const description = match[2].trim()
      const priceStr = match[3].replace(/[€$£₹\s]/g, "").replace(",", ".")
      const price = parseFloat(priceStr)
      if (price > 0 && price < 500 && name.length >= 3) {
        return { name, price, description }
      }
    }

    match = line.match(pattern2)
    if (match) {
      const name = match[1].trim()
      const priceStr = match[2].replace(/[€$£₹\s]/g, "").replace(",", ".")
      const price = parseFloat(priceStr)
      if (price > 0 && price < 500 && name.length >= 3) {
        return { name, price }
      }
    }

    match = line.match(pattern1)
    if (match) {
      const name = match[1].trim()
      const priceStr = match[2].replace(/[€$£₹\s]/g, "").replace(",", ".")
      const price = parseFloat(priceStr)
      if (price > 0 && price < 500 && name.length >= 3) {
        return { name, price }
      }
    }

    return null
  }

  const parseMenuText = (text: string): Array<{ name: string; price: number; category: string; description?: string }> => {
    // Clean up text first - remove excessive whitespace but preserve structure
    // Apply intelligent text correction first
    const correctedText = correctOCRText(text)
    
    const cleanedText = correctedText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
      .trim()
    
    const lines = cleanedText.split("\n").map(line => line.trim()).filter((line) => line.length > 0)
    const items: Array<{ name: string; price: number; category: string; description?: string }> = []
    let currentCategory = "Main"

    // Patterns to exclude (phone numbers, addresses, delivery info, etc.)
    const excludePatterns = [
      /^\d{3}[\s\-]?\d{3}[\s\-]?\d{3,4}$/, // Phone numbers like 960 096 661
      /^\+?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,9}$/, // International phone
      /chamada\s+para\s+rede/i, // "Chamada para rede móvel nacional"
      /delivery\s+available|entrega\s+grátis|grátis\s*\*|free\s*delivery/i, // Delivery info
      /halal|certified|certificação/i, // Certifications
      /iva\s+incluído|taxa\s+legal|vigor|preços\s+com/i, // Price disclaimers
      /^[^\w]*$/, // Only special characters
      /^.{1,2}$/, // Too short (1-2 chars)
      /^\d+km[\s\-]?\d+km/i, // Distance info like "1KM-5KM"
      /^\d+am[\s\-]?\d+am|todos\s+os\s+dias/i, // Hours like "10AM-12AM Todos os Dias"
      /avenida|rua|street|address/i, // Addresses
      /uber\s+eats|bolt\s+food/i, // App names
    ]

    // Category detection - more comprehensive
    const categoryKeywords: Record<string, string> = {
      "pizza": "Main",
      "pizzas": "Main",
      "kebab": "Main",
      "kebabs": "Main",
      "hamburger": "Main",
      "hambúrguer": "Main",
      "hamburgers": "Main",
      "burger": "Main",
      "burgers": "Main",
      "churrasqueira": "Main",
      "churrasco": "Main",
      "bocadillos": "Main",
      "bocadillo": "Main",
      "sandwich": "Main",
      "sandwiches": "Main",
      "starter": "Starter",
      "appetizer": "Starter",
      "entrée": "Starter",
      "salad": "Starter",
      "salada": "Starter",
      "salads": "Starter",
      "ensaladas": "Starter",
      "soup": "Starter",
      "sopa": "Starter",
      "dessert": "Dessert",
      "sobremesa": "Dessert",
      "beverage": "Beverage",
      "drink": "Beverage",
      "bebida": "Beverage",
      "bebidas": "Beverage",
      "drinks": "Beverage",
      "extra": "Main",
      "extras": "Main",
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Skip excluded patterns
      if (excludePatterns.some(pattern => pattern.test(line))) {
        continue
      }

      // Check for category headers (must be short, no numbers, and match keywords)
      const lowerLine = line.toLowerCase().trim()
      for (const [keyword, category] of Object.entries(categoryKeywords)) {
        // Category headers are usually short, all caps or title case, and contain the keyword
        if (
          lowerLine === keyword || 
          (lowerLine.includes(keyword) && line.length < 30 && !/\d/.test(line) && line.length > 2)
        ) {
          currentCategory = category
          break
        }
      }

      // Skip if line is likely a category header (all caps, short, no price)
      if (/^[A-Z\s]{2,20}$/.test(line) && !/\d/.test(line)) {
        // Check if it's a known category
        const isKnownCategory = Object.keys(categoryKeywords).some(k => 
          line.toLowerCase().includes(k.toLowerCase())
        )
        if (isKnownCategory) continue
      }

      // Try intelligent pattern recognition first
      const patternMatch = recognizeMenuItemPattern(line)
      if (patternMatch) {
        const { name: patternName, price: patternPrice, description: patternDesc } = patternMatch
        
        // Validate the extracted name
        const letterCount = (patternName.match(/[a-zA-ZÀ-ÿ]/g) || []).length
        const totalChars = patternName.length
        
        if (
          patternName.length >= 3 &&
          patternName.length <= 80 &&
          letterCount >= totalChars * 0.3 &&
          !excludePatterns.some(pattern => pattern.test(patternName)) &&
          !/^(média|grande|pequeno|peq\.?|small|medium|large)$/i.test(patternName)
        ) {
          // Clean and format name
          let cleanName = patternName
            .replace(/^[\d\.\)\-\s]+/, "")
            .replace(/[\-\|:]+$/, "")
            .replace(/\s+/g, " ")
            .trim()

          // Preserve capitalization but fix obvious issues
          if (/^[a-z\s]+$/.test(cleanName) && cleanName.length > 3) {
            cleanName = cleanName
              .split(" ")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          }

          items.push({
            name: cleanName,
            price: Math.round(patternPrice * 100) / 100,
            category: currentCategory,
            description: patternDesc,
          })
          continue
        }
      }

      // Fallback to traditional price pattern matching
      const pricePatterns = [
        /([€$£₹]|USD|Rs\.?)\s*(\d+[,\.]\d{2})/, // Currency symbol before: €3,50 or $3.50
        /(\d+[,\.]\d{2})\s*([€$£₹])/, // Currency symbol after: 3,50€ or 3.50$
        /([€$£₹]|USD)\s*(\d+)/, // Currency with whole number: €5
        /(\d+)\s*([€$£₹])/, // Whole number with currency: 5€
      ]

      let priceMatch: RegExpMatchArray | null = null
      let price = 0
      let priceIndex = -1

      for (const pattern of pricePatterns) {
        const match = line.match(pattern)
        if (match) {
          // Extract the number part
          const numStr = match[2] || match[1]
          // Handle European format (comma as decimal) and US format (dot as decimal)
          price = parseFloat(numStr.replace(",", "."))
          priceIndex = match.index || 0
          priceMatch = match
          break
        }
      }

      // Validate price range (reasonable menu prices)
      if (priceMatch && price > 0.5 && price < 500) {
        // Extract item name and description
        let namePart = line.substring(0, priceIndex).trim()
        
        // Extract description from parentheses if present
        let description: string | undefined = undefined
        const descMatch = namePart.match(/\(([^)]+)\)/)
        if (descMatch) {
          description = descMatch[1].trim()
          namePart = namePart.replace(/\s*\([^)]+\)\s*/, "").trim()
        }
        
        // Remove common prefixes/suffixes that aren't part of the dish name
        namePart = namePart
          .replace(/^\d+\.\s*/, "") // Remove leading numbers like "1. " or "2. "
          .replace(/^menu\s+/i, "") // Remove "Menu " prefix
          .replace(/\s*menu\s*$/i, "") // Remove " Menu" suffix
          .trim()

        // Clean up the name but preserve exact spelling from OCR
        let cleanName = namePart
          .replace(/^[\d\.\)\-\s]+/, "") // Remove leading numbers, dots, parentheses, dashes
          .replace(/[\-\|:]+$/, "") // Remove trailing separators
          .replace(/\s+/g, " ") // Normalize multiple spaces to single space
          .trim()

        // Additional validation for menu item names
        const letterCount = (cleanName.match(/[a-zA-ZÀ-ÿ]/g) || []).length
        const totalChars = cleanName.length
        
        // Must be a valid menu item name
        if (
          cleanName.length >= 3 &&
          cleanName.length <= 80 &&
          letterCount >= totalChars * 0.3 && // At least 30% letters (allows for numbers in names)
          !/^[A-Z\s]{15,}$/.test(cleanName) && // Not all caps very long text (likely headers)
          !excludePatterns.some(pattern => pattern.test(cleanName)) && // Not in exclude list
          !/^(média|grande|pequeno|peq\.?|small|medium|large)$/i.test(cleanName) // Not size indicators
        ) {
          // Preserve original capitalization from OCR (don't force title case)
          // Only fix obvious issues like all lowercase or all uppercase
          if (/^[a-z\s]+$/.test(cleanName) && cleanName.length > 3) {
            // If all lowercase, capitalize first letter of each word
            cleanName = cleanName
              .split(" ")
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          } else if (/^[A-Z\s]+$/.test(cleanName) && cleanName.length > 15) {
            // If all uppercase and long, convert to title case
            cleanName = cleanName
              .split(" ")
              .map(word => word.charAt(0) + word.slice(1).toLowerCase())
              .join(" ")
          }

          items.push({
            name: cleanName,
            price: Math.round(price * 100) / 100, // Round to 2 decimals
            category: currentCategory,
            description: description && description.length > 0 ? description : undefined,
          })
        }
      }
    }

    // Remove duplicates (by name, case-insensitive)
    const uniqueItems = items.filter((item, index, self) => {
      const normalizedName = item.name.toLowerCase().trim()
      const firstIndex = self.findIndex((t) => t.name.toLowerCase().trim() === normalizedName)
      return index === firstIndex
    })

    // Filter out items that are too similar (likely OCR errors)
    const filteredItems = uniqueItems.filter((item, index) => {
      // Check if this item is too similar to others (likely OCR duplicate)
      const similar = uniqueItems.some((other, otherIndex) => {
        if (index === otherIndex) return false
        const name1 = item.name.toLowerCase()
        const name2 = other.name.toLowerCase()
        // If names are very similar (80% match) and prices are close, likely duplicate
        const similarity = name1.length > 0 && name2.length > 0 
          ? (name1.split("").filter(c => name2.includes(c)).length / Math.max(name1.length, name2.length))
          : 0
        return similarity > 0.8 && Math.abs(item.price - other.price) < 0.5
      })
      return !similar
    })

    return filteredItems
  }

  const handleImageUpload = async (file: File) => {
    if (!session) return

    setIsProcessing(true)
    setOcrDialogOpen(true)
    setImagePreview(URL.createObjectURL(file))
    setOcrConfidence(0)
    setProcessingStep("Analyzing menu with AI vision...")

    try {
      // Primary: Use AI Vision for menu extraction
      setProcessingStep("Extracting menu items with AI vision model...")
      toast.info("Processing image with AI vision... This may take 10-20 seconds.")
      
      const aiItems = await extractMenuWithAI(file)
      
      setProcessingStep("")
      setOcrConfidence(95) // AI vision typically has high accuracy
      
      if (aiItems.length === 0) {
        // Fallback to OCR if AI returns no items
        setProcessingStep("AI found no items. Trying OCR fallback...")
        toast.warning("AI found no items. Trying OCR as fallback...")
        
        const worker = await createWorker(["eng", "por", "spa"], 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setProcessingStep(`OCR Fallback: ${Math.round(m.progress * 100)}%`)
            }
          },
        })
        
        const result = await worker.recognize(file, {
          tessedit_pageseg_mode: "6",
        })
        
        await worker.terminate()
        
        const correctedText = fixCommonOCRErrors(result.data.text)
        const ocrItems = parseMenuText(correctedText)
        setOcrConfidence(result.data.confidence || 0)
        
        if (ocrItems.length === 0) {
          toast.error("No menu items found. Please try a clearer image.")
          setExtractedItems([])
        } else {
          toast.success(`Found ${ocrItems.length} items using OCR fallback`)
          setExtractedItems(ocrItems)
        }
      } else {
        toast.success(`Found ${aiItems.length} menu items with AI vision!`)
        setExtractedItems(aiItems)
      }
    } catch (error: any) {
      console.error("Menu Extraction Error:", error)
      
      // Fallback to OCR if AI fails
      if (error.message?.includes("API key") || error.message?.includes("not configured")) {
        setProcessingStep("AI not configured. Using OCR fallback...")
        toast.warning("AI vision not configured. Falling back to OCR...")
        
        try {
          const worker = await createWorker(["eng", "por", "spa"], 1, {
            logger: (m) => {
              if (m.status === "recognizing text") {
                setProcessingStep(`OCR: ${Math.round(m.progress * 100)}%`)
              }
            },
          })
          
          const result = await worker.recognize(file, {
            tessedit_pageseg_mode: "6",
          })
          
          await worker.terminate()
          
          const correctedText = fixCommonOCRErrors(result.data.text)
          const ocrItems = parseMenuText(correctedText)
          setOcrConfidence(result.data.confidence || 0)
          
          if (ocrItems.length === 0) {
            toast.error("No menu items found. Please try a clearer image.")
            setExtractedItems([])
          } else {
            toast.success(`Found ${ocrItems.length} items using OCR`)
            setExtractedItems(ocrItems)
          }
        } catch (ocrError) {
          console.error("OCR Fallback Error:", ocrError)
          toast.error("Failed to process image. Please try again.")
          setExtractedItems([])
        }
      } else {
        // Show detailed error message
        const errorMsg = error.message || "Unknown error"
        console.error("Full error details:", error)
        toast.error(`Failed to extract menu: ${errorMsg}`, {
          description: errorMsg.includes("API key") 
            ? "Make sure OPENAI_API_KEY is set in .env.local and restart the dev server"
            : "Check the console for more details"
        })
        setExtractedItems([])
      }
      setProcessingStep("")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddExtractedItems = async () => {
    if (!session) {
      toast.error("Session expired. Please refresh the page.")
      return
    }

    if (extractedItems.length === 0) {
      toast.error("No items to add")
      return
    }

    setIsProcessing(true)
    let addedCount = 0
    const errors: string[] = []

    for (const item of extractedItems) {
      try {
        // Validate item before adding
        if (!item.name || !item.name.trim()) {
          errors.push(`Skipped item with empty name`)
          continue
        }
        if (!item.price || item.price <= 0) {
          errors.push(`Skipped "${item.name}" - invalid price`)
          continue
        }

        await addMenuItem(session.userId, {
          name: item.name.trim(),
          price: item.price,
          category: item.category || "Main",
        })
        addedCount++
      } catch (error: any) {
        const errorMsg = error.message || "Unknown error"
        console.error(`Error adding item "${item.name}":`, error)
        errors.push(`${item.name}: ${errorMsg}`)
      }
    }

    setIsProcessing(false)

    if (addedCount > 0) {
      toast.success(`Successfully added ${addedCount} menu item${addedCount === 1 ? '' : 's'}!`)
      await refreshItems()
      
      // Close dialog after successful addition
      setOcrDialogOpen(false)
      setExtractedItems([])
      setImagePreview(null)
    } else {
      // Show error if no items were added
      const errorMsg = errors.length > 0 
        ? `Failed to add items:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}`
        : "Failed to add menu items. Please try again."
      toast.error(errorMsg, {
        duration: 5000,
      })
    }
  }

  const handleEditExtractedItem = (index: number, field: "name" | "price" | "category" | "description", value: string | number) => {
    setExtractedItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleRemoveExtractedItem = (index: number) => {
    setExtractedItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Menu</h2>
          <p className="text-sm text-muted-foreground">{items.length} items in your menu</p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="flex h-10 items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
              title="Delete all menu items"
            >
              <Trash className="h-4 w-4" />
              Delete All
            </button>
          )}
          <button
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.accept = "image/*"
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  await handleImageUpload(file)
                }
              }
              input.click()
            }}
            className="flex h-12 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <Upload className="h-4 w-4" />
            Extract Menu with AI
          </button>
        <button
          onClick={openAdd}
          className="flex h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
        </div>
      </div>

      {Object.entries(groupedItems).map(([cat, catItems]) => (
        <div key={cat}>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h3>
          <HoverEffect className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 py-0">
            {catItems.map((item) => {
              return (
                <Card key={item.id} className="py-0">
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-lg font-bold text-primary">{formatter.format(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </HoverEffect>
        </div>
      ))}

      {items.length === 0 && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full">
            <div className="border border-dashed bg-card dark:bg-black border-border dark:border-neutral-800 rounded-lg">
              <FileUpload 
                onChange={(files) => {
                  if (files.length > 0) {
                    handleImageUpload(files[0])
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Margherita Pizza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-base"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Price ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="12.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Extras Section */}
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label>Extras/Add-ons (Optional)</Label>
                <button
                  type="button"
                  onClick={addExtra}
                  className="flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add Extra
                </button>
              </div>
              {extras.length > 0 && (
                <div className="space-y-2">
                  {extras.map((extra, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Extra name (e.g., Extra Cheese)"
                        value={extra.name}
                        onChange={(e) => updateExtra(index, "name", e.target.value)}
                        className="h-10 flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={extra.price}
                        onChange={(e) => updateExtra(index, "price", e.target.value)}
                        className="h-10 w-24"
                      />
                      <button
                        type="button"
                        onClick={() => removeExtra(index)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label="Remove extra"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Extras can be added to orders in the order summary. Prices will be added to the base item price.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="flex h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {editingItem ? "Save Changes" : "Add Item"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure? This cannot be undone.
          </p>
          <DialogFooter>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="flex h-12 items-center justify-center rounded-lg bg-destructive px-6 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <Dialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Menu Items</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete all {items.length} menu items? This action cannot be undone.
            </p>
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">
                ⚠️ Warning: This will permanently delete all menu items from your menu.
              </p>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDeleteAllConfirm(false)}
              className="flex h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAll}
              className="flex h-12 items-center justify-center rounded-lg bg-destructive px-6 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete All Items
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OCR Extraction Dialog */}
      <Dialog open={ocrDialogOpen} onOpenChange={(open) => {
        setOcrDialogOpen(open)
        if (!open) {
          // Clean up when dialog closes
          setExtractedItems([])
          setImagePreview(null)
          setIsProcessing(false)
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Extract Menu from Image</DialogTitle>
          </DialogHeader>
          
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                {processingStep || "Processing image with AI vision..."}
              </p>
              {ocrConfidence > 0 && (
                <p className="text-xs text-muted-foreground">
                  {processingStep?.includes("OCR") ? "OCR" : "AI"} Confidence: {Math.round(ocrConfidence)}%
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {processingStep?.includes("OCR") 
                  ? "This may take 10-30 seconds" 
                  : "AI vision processing... This may take 10-20 seconds"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-4">
              {imagePreview && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <img src={imagePreview} alt="Menu preview" className="w-full h-auto max-h-64 object-contain" />
                </div>
              )}

              {extractedItems.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      Found {extractedItems.length} items. Review and edit before adding:
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3 border border-border rounded-lg p-4">
                    {extractedItems.map((item, index) => (
                      <div key={index} className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Item Name</Label>
                              <Input
                                value={item.name}
                                onChange={(e) => handleEditExtractedItem(index, "name", e.target.value)}
                                className="h-10 text-sm"
                                placeholder="Item name"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Price</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) => handleEditExtractedItem(index, "price", parseFloat(e.target.value) || 0)}
                                className="h-10 text-sm"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Category</Label>
                              <Select
                                value={item.category}
                                onValueChange={(value) => handleEditExtractedItem(index, "category", value)}
                              >
                                <SelectTrigger className="h-10 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveExtractedItem(index)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-6"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {item.description && (
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">Description (optional)</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => handleEditExtractedItem(index, "description", e.target.value)}
                              className="h-10 text-sm"
                              placeholder="Item description"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No items found. Try uploading a clearer image with visible menu text.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <button
              onClick={() => {
                setOcrDialogOpen(false)
                setExtractedItems([])
                setImagePreview(null)
                setIsProcessing(false)
              }}
              className="flex h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
              {extractedItems.length > 0 && (
              <button
                onClick={handleAddExtractedItems}
                className="flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Add {extractedItems.length} {extractedItems.length === 1 ? "Item" : "Items"}
              </button>
            )}
            {ocrConfidence > 0 && !isProcessing && (
              <div className="text-xs text-muted-foreground text-center">
                {ocrConfidence >= 90 ? "AI Vision" : "OCR"} Confidence: {Math.round(ocrConfidence)}%
                {ocrConfidence < 60 && (
                  <span className="text-yellow-500 ml-2">(Low confidence - results may need manual review)</span>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
