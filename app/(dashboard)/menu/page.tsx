"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/store"
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
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createWorker } from "tesseract.js"

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const categories = ["Main", "Starter", "Dessert", "Beverage"]

export default function MenuPage() {
  const { session } = useAuth()
  const [items, setItems] = useState<MenuItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("Main")
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedItems, setExtractedItems] = useState<Array<{ name: string; price: number; category: string }>>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Load items when session changes
  useEffect(() => {
    if (session) {
      setItems(getMenuItems(session.userId))
    } else {
      setItems([])
    }
  }, [session])

  const refreshItems = useCallback(() => {
    if (session) setItems(getMenuItems(session.userId))
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
    setEditingItem(null)
    setName("")
    setPrice("")
    setCategory("Main")
    setDialogOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setName(item.name)
    setPrice(item.price.toString())
    setCategory(item.category)
    setDialogOpen(true)
  }

  const handleSave = () => {
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

    if (editingItem) {
      updateMenuItem(session.userId, editingItem.id, { name: name.trim(), price: priceNum, category })
      toast.success("Menu item updated!")
    } else {
      addMenuItem(session.userId, { name: name.trim(), price: priceNum, category })
      toast.success("Menu item added!")
    }

    refreshItems()
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (!session) return
    deleteMenuItem(session.userId, id)
    toast.success("Menu item deleted")
    refreshItems()
    setDeleteConfirm(null)
  }

  const parseMenuText = (text: string): Array<{ name: string; price: number; category: string }> => {
    const lines = text.split("\n").map(line => line.trim()).filter((line) => line.length > 0)
    const items: Array<{ name: string; price: number; category: string }> = []
    let currentCategory = "Main"

    // Patterns to exclude (phone numbers, addresses, delivery info, etc.)
    const excludePatterns = [
      /^\d{3}[\s\-]?\d{3}[\s\-]?\d{3,4}$/, // Phone numbers
      /^\+?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,9}$/, // International phone
      /delivery|entrega|grátis|free|available|chamada|rede|móvel|nacional/i, // Delivery info
      /halal|certified|certificação/i, // Certifications
      /iva|taxa|legal|vigor|preços|prices/i, // Price disclaimers
      /^[^\w]*$/, // Only special characters
      /^.{1,2}$/, // Too short (1-2 chars)
      /^[A-Z\s]{3,}$/, // All caps headers (likely not menu items)
      /menu\s*[\d,\.]+€?/i, // "Menu 5,50€" pattern (combo meals)
      /^\d+\.?\s*[A-Z]/i, // Numbered lists that aren't items
    ]

    // Category detection
    const categoryKeywords: Record<string, string> = {
      "starter": "Starter",
      "appetizer": "Starter",
      "entrée": "Starter",
      "dessert": "Dessert",
      "beverage": "Beverage",
      "drink": "Beverage",
      "bebida": "Beverage",
      "soup": "Starter",
      "salad": "Starter",
      "salada": "Starter",
      "pizza": "Main",
      "pasta": "Main",
      "burger": "Main",
      "hamburger": "Main",
      "hambúrguer": "Main",
      "sandwich": "Main",
      "kebab": "Main",
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Skip excluded patterns
      if (excludePatterns.some(pattern => pattern.test(line))) {
        continue
      }

      // Check for category headers
      const lowerLine = line.toLowerCase()
      for (const [keyword, category] of Object.entries(categoryKeywords)) {
        if (lowerLine.includes(keyword) && line.length < 40 && !/\d/.test(line)) {
          currentCategory = category
          continue
        }
      }

      // Price patterns: handle both $3.50 and €3,50 (European format with comma)
      // Also handle prices like "3,50€", "3.50€", "$3.50", "€3,50"
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
        // Extract item name (everything before the price)
        const namePart = line.substring(0, priceIndex).trim()
        
        // Clean up the name
        let cleanName = namePart
          .replace(/^[\d\.\)\-\s]+/, "") // Remove leading numbers, dots, parentheses, dashes
          .replace(/[\-\|:]+$/, "") // Remove trailing separators
          .replace(/\s+/g, " ") // Normalize spaces
          .trim()

        // Additional validation for menu item names
        // Must have at least 3 characters, mostly letters, not all caps (unless short)
        const letterCount = (cleanName.match(/[a-zA-ZÀ-ÿ]/g) || []).length
        const totalChars = cleanName.length
        
        if (
          cleanName.length >= 3 &&
          cleanName.length <= 60 &&
          letterCount >= totalChars * 0.4 && // At least 40% letters
          !/^[A-Z\s]{10,}$/.test(cleanName) && // Not all caps long text (likely headers)
          !excludePatterns.some(pattern => pattern.test(cleanName)) // Not in exclude list
        ) {
          // Capitalize first letter of each word for better presentation
          cleanName = cleanName
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ")

          items.push({
            name: cleanName,
            price: Math.round(price * 100) / 100, // Round to 2 decimals
            category: currentCategory,
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

    try {
      toast.info("Processing image... This may take a moment.")
      
      // Use multi-language OCR (English + Portuguese + Spanish for better menu recognition)
      const worker = await createWorker(["eng", "por", "spa"])
      const { data: { text } } = await worker.recognize(file)
      await worker.terminate()

      const parsedItems = parseMenuText(text)
      
      if (parsedItems.length === 0) {
        toast.error("No menu items found in the image. Please try a clearer image.")
        setExtractedItems([])
      } else {
        toast.success(`Found ${parsedItems.length} menu items!`)
        setExtractedItems(parsedItems)
      }
    } catch (error) {
      console.error("OCR Error:", error)
      toast.error("Failed to process image. Please try again.")
      setExtractedItems([])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddExtractedItems = () => {
    if (!session) return

    let addedCount = 0
    extractedItems.forEach((item) => {
      try {
        addMenuItem(session.userId, {
          name: item.name,
          price: item.price,
          category: item.category,
        })
        addedCount++
      } catch (error) {
        console.error("Error adding item:", error)
      }
    })

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} menu items!`)
      refreshItems()
    }

    setOcrDialogOpen(false)
    setExtractedItems([])
    setImagePreview(null)
  }

  const handleEditExtractedItem = (index: number, field: "name" | "price" | "category", value: string | number) => {
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
            Scan Menu Image
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catItems.map((item) => (
              <Card key={item.id} className="py-0">
                <CardContent className="flex items-center gap-3 p-4">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <p className="text-muted-foreground">No menu items yet.</p>
            <button onClick={openAdd} className="text-sm font-medium text-primary hover:underline">
              Add your first item
            </button>
          </CardContent>
        </Card>
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

      {/* OCR Extraction Dialog */}
      <Dialog open={ocrDialogOpen} onOpenChange={setOcrDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Extract Menu from Image</DialogTitle>
          </DialogHeader>
          
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing image with OCR...</p>
              <p className="text-xs text-muted-foreground">This may take 10-30 seconds</p>
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

                  <div className="max-h-96 overflow-y-auto space-y-2 border border-border rounded-lg p-4">
                    {extractedItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <Input
                            value={item.name}
                            onChange={(e) => handleEditExtractedItem(index, "name", e.target.value)}
                            className="h-10"
                            placeholder="Item name"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.price}
                            onChange={(e) => handleEditExtractedItem(index, "price", parseFloat(e.target.value) || 0)}
                            className="h-10"
                            placeholder="Price"
                          />
                          <Select
                            value={item.category}
                            onValueChange={(value) => handleEditExtractedItem(index, "category", value)}
                          >
                            <SelectTrigger className="h-10">
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
                        <button
                          onClick={() => handleRemoveExtractedItem(index)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
