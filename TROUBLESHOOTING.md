# Troubleshooting AI Vision Menu Extraction

## Common Issues and Solutions

### 1. "AI vision not configured" or "Failed to process image with AI"

**Solution:**
1. **Restart your development server** - Environment variables are only loaded when the server starts
   - Stop the server (Ctrl+C)
   - Run `pnpm dev` or `npm run dev` again

2. **Verify your API key:**
   - Open `.env.local` in the project root
   - Make sure `OPENAI_API_KEY` is set (not the placeholder text)
   - The key should start with `sk-` for OpenAI

3. **Check API key validity:**
   - Go to https://platform.openai.com/api-keys
   - Verify your key is active and has credits
   - If needed, create a new key

### 2. "Invalid API key" or "Unauthorized"

**Solution:**
- Your API key might be incorrect or expired
- Generate a new key at https://platform.openai.com/api-keys
- Update `.env.local` with the new key
- **Restart the dev server**

### 3. "Rate limit exceeded"

**Solution:**
- You've made too many requests too quickly
- Wait a few minutes and try again
- Check your usage at https://platform.openai.com/usage

### 4. "No menu items found"

**Solution:**
- The image might be too blurry or low quality
- Try uploading a clearer, higher resolution image
- Make sure the menu text is clearly visible
- The system will automatically fall back to OCR if AI fails

### 5. Environment variable not loading

**Solution:**
- Make sure `.env.local` is in the **root directory** of your project
- The file should be named exactly `.env.local` (not `.env` or `.env.local.txt`)
- **Always restart the dev server** after changing environment variables

## Testing Your Setup

1. Check if the API key is loaded:
   - Look at the server console when starting
   - No errors should appear about missing API keys

2. Test the API endpoint:
   - Open browser console (F12)
   - Upload a menu image
   - Check the console for detailed error messages

3. Verify API key format:
   - Should start with `sk-`
   - Should be a long string (50+ characters)
   - No spaces or quotes around it in `.env.local`

## Still Having Issues?

1. Check the browser console for detailed error messages
2. Check the server console for API errors
3. Verify your OpenAI account has credits/usage available
4. Try the OCR fallback (it should work automatically if AI fails)
