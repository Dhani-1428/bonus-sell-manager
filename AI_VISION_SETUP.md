# AI Vision Menu Extraction Setup

This application uses OpenAI's Vision API to extract menu items from images with high accuracy.

## Setup Instructions

1. **Get an OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Sign up or log in to your OpenAI account
   - Create a new API key

2. **Configure the API Key:**
   - Create a `.env.local` file in the root directory
   - Add your API key:
     ```
     OPENAI_API_KEY=your_actual_api_key_here
     ```

3. **Restart the Development Server:**
   - Stop your current server (Ctrl+C)
   - Run `npm run dev` or `pnpm dev` again

## How It Works

- When you upload a menu image, it's sent to OpenAI's GPT-4 Vision model
- The AI analyzes the image and extracts all menu items with:
  - Exact item names
  - Prices (numbers only)
  - Categories (Main, Starter, Dessert, Beverage)
- The AI automatically ignores:
  - Logos and decorative elements
  - Phone numbers and addresses
  - Delivery information
  - Legal disclaimers

## Fallback

If the AI vision API is not configured or fails, the system automatically falls back to OCR (Tesseract.js) for menu extraction.

## Cost

OpenAI API usage is charged per image. GPT-4 Vision pricing:
- ~$0.01-0.03 per menu image (depending on image size)

Make sure to monitor your OpenAI usage at https://platform.openai.com/usage
