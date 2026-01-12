# 🔍 Troubleshooting: PDF Still Converting to Images

## Quick Diagnostic Steps

### Step 1: Check Backend Logs (MOST IMPORTANT)

When you upload a PDF, watch the **backend terminal**. You should see:

```
✅ CORRECT OUTPUT (PDF.js approach):
=== Starting PDF Upload (Raw Format) ===
🔄 Using PDF.js rendering - No image conversion!
✅ PDF uploaded as raw file: https://res.cloudinary.com/...
📄 PDF will be rendered client-side with PDF.js
🔗 Hyperlinks will be preserved and clickable
```

```
❌ WRONG OUTPUT (Old image approach):
=== Starting PDF Upload ===
Step 1: Uploading PDF as raw file...
Step 2: Uploading PDF for page extraction...  ← BAD! Should NOT see this
Generating page URLs with pg_ transformation...  ← BAD! Should NOT see this
```

**If you see "Step 2" or "page extraction" → The old code is still running!**

---

### Step 2: Verify Files Were Updated

Run this in the backend folder:
```bash
grep -n "PDF.js rendering" services/cloudinary.js
```

**Should return:** Line number with the text "PDF.js will render pages client-side"

**If nothing found:** The file wasn't updated correctly.

---

### Step 3: Check Document in MongoDB

After uploading, check the document structure in MongoDB:

```javascript
// In MongoDB or via Node.js
db.documents.findOne({}, { files: 1 })
```

**✅ CORRECT (PDF.js):**
```json
{
  "files": {
    "pdf": {
      "original": {
        "url": "https://res.cloudinary.com/.../raw/upload/...",
        "resourceType": "raw"
      }
      // NO pages array
      // NO pageExtraction field
    }
  }
}
```

**❌ WRONG (Old):**
```json
{
  "files": {
    "pdf": {
      "pages": [
        { "page": 1, "url": "..." },
        { "page": 2, "url": "..." }
      ],
      "pageExtraction": { ... }
    }
  }
}
```

**If you see `pages` array → Document was created with old code!**

---

### Step 4: Check Frontend Console

Open browser DevTools → Console when viewing a flipbook:

**✅ CORRECT:**
```
🔄 Loading PDF from Cloudinary...
📄 PDF URL: https://res.cloudinary.com/.../raw/upload/...
🔧 Resource Type: raw
⏳ PDF loading task started...
✅ PDF loaded successfully!
📊 Total pages: 5
🎉 PDF ready for rendering with PDF.js!
```

**❌ WRONG:**
```
Setting up PDF pages: 5
Adding video page at the end
(Using image URLs instead of PDF)
```

---

### Step 5: Restart Everything

Sometimes Node.js caches old code. **Fully restart:**

```bash
# Kill all Node processes
# Windows:
taskkill /F /IM node.exe

# Then restart fresh:
cd backend
npm start

# In new terminal:
cd frontend  
npm run dev
```

---

## Common Issues & Fixes

### Issue 1: Backend Still Using Old Code

**Symptom:** Backend logs show "Step 2: Uploading PDF for page extraction"

**Fix:**
```bash
# 1. Stop backend (Ctrl+C)
# 2. Verify the file content:
cd backend
cat services/cloudinary.js | grep "PDF.js"
# Should see: "PDF.js will render pages client-side"

# 3. If not found, the file wasn't updated
# Re-apply the changes or check git status

# 4. Restart backend
npm start
```

---

### Issue 2: Old Documents Still Use Images

**Symptom:** New uploads work but old documents show images

**This is normal!** Old documents were created with the old system.

**Solution:**
- New uploads will use PDF.js
- Old documents need to be re-uploaded
- See MIGRATION_GUIDE.md

---

### Issue 3: CORS Errors

**Symptom:** Console shows:
```
Access to fetch at 'https://res.cloudinary.com/...' has been blocked by CORS policy
```

**Fix:**
1. Go to https://cloudinary.com/console
2. Settings → Security
3. Add your domain to CORS allowed origins:
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Your production domain

---

### Issue 4: PDF Loads But No Hyperlinks

**Symptom:** PDF renders but links aren't clickable

**Fix:**
Check if the PDF actually has hyperlinks:
1. Open the PDF in Adobe Reader
2. Try clicking links
3. If they don't work there either, the PDF has no links

If PDF has links in Adobe:
- Check browser console for annotation layer errors
- Verify index.css has `.annotationLayer` styles
- Check z-index issues in CSS

---

## Verification Script

Run this to verify setup:

```bash
cd backend
node test-pdfjs-setup.js
```

This will check:
- ✅ Dependencies installed
- ✅ Components exist
- ✅ Environment variables set
- ✅ Cloudinary service updated
- ✅ FlipbookViewer updated

---

## Test Upload Flow

1. **Delete any test documents** from your system
2. **Upload a NEW PDF** via admin panel
3. **Watch the backend terminal** closely
4. **Check for "PDF.js rendering" message**
5. **View the document** in frontend
6. **Check browser console** for PDF.js logs

---

## Still Not Working?

### Collect Debug Info:

**From Backend Terminal:**
- Copy last 50 lines of logs during upload
- Look for "Step 2" or "page extraction"

**From Browser Console:**
- Copy all logs when viewing document
- Look for PDF loading messages
- Check for errors

**From MongoDB:**
- Show the files structure of one document
- Check if it has `pages` array

**Then:**
1. Share this info
2. We can diagnose the exact issue
3. Provide specific fix

---

## Nuclear Option: Fresh Start

If nothing works, try fresh upload:

```bash
# 1. Delete ALL documents from MongoDB
db.documents.deleteMany({})

# 2. Clear Cloudinary storage (optional)

# 3. Restart backend with fresh logs
cd backend
npm start > backend-logs.txt 2>&1

# 4. Upload ONE test PDF

# 5. Check backend-logs.txt for details
```

---

## Expected vs Actual

Fill this out to diagnose:

**Backend Logs (during upload):**
```
What you see:


What you should see:
✅ PDF uploaded as raw file
📄 PDF will be rendered client-side
```

**MongoDB Document:**
```
What you see:


What you should see:
{ files: { pdf: { original: { resourceType: "raw" } } } }
```

**Browser Console (viewing):**
```
What you see:


What you should see:
🔄 Loading PDF from Cloudinary...
✅ PDF loaded successfully!
```

---

**Next Step:** Run through Step 1 first - check backend logs during upload!
