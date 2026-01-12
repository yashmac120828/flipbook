# 🚀 Quick Start Guide - PDF.js Flipbook

## Get Started in 5 Minutes

### 1️⃣ Prerequisites Check ✅
Already installed (verify in package.json):
- ✅ `pdfjs-dist@^3.11.174`
- ✅ `react-pageflip@^2.0.3`

### 2️⃣ Configure Cloudinary CORS

**Critical Step!**

1. Go to: https://cloudinary.com/console
2. Navigate to: **Settings → Security**
3. Under **CORS Settings**, add:
   ```
   http://localhost:5173
   http://localhost:3000
   https://yourdomain.com
   ```

### 3️⃣ Environment Variables

Make sure your `.env` has:
```env
# Backend .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=flipbook

# MongoDB
MONGODB_URI=your_mongodb_uri

# JWT
JWT_SECRET=your_jwt_secret
```

```env
# Frontend .env
VITE_API_URL=http://localhost:8000
```

### 4️⃣ Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # if needed
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # if needed
npm run dev
```

### 5️⃣ Test the Implementation

#### Upload a Test PDF:
1. Go to: `http://localhost:5173/admin/login`
2. Login with admin credentials
3. Navigate to: Upload
4. Upload:
   - PDF file (with hyperlinks if possible)
   - Video file (optional)
5. Fill in title and description
6. Click "Upload"

#### View the Flipbook:
1. After upload, go to Documents
2. Click "View" on your document
3. **Test:**
   - ✅ Pages flip smoothly
   - ✅ Hyperlinks are clickable
   - ✅ Text is selectable
   - ✅ Video loops automatically (if uploaded)
   - ✅ Keyboard navigation works (arrow keys)

---

## 🔍 Quick Verification

### Is it Working? Check These:

**✅ PDF Loads:**
- You see the flipbook interface
- Pages render clearly
- No CORS errors in console

**✅ Hyperlinks Work:**
- Links are visible (yellow highlight on hover)
- Clicking opens in new tab
- External links work

**✅ Video Plays:**
- Starts automatically
- Loops continuously
- No control buttons visible

**✅ Navigation Works:**
- Arrow keys flip pages
- Click arrows work
- Thumbnail clicks work

---

## 🐛 Quick Troubleshooting

### PDF Won't Load?
```
Problem: "Failed to load PDF"
Solution: Configure Cloudinary CORS (see step 2)
```

### No Hyperlinks Visible?
```
Problem: Links not clickable
Solution: Check console for PDF.js errors
         Verify annotation layer CSS is loaded
```

### Video Won't Play?
```
Problem: Video doesn't autoplay
Solution: Video must be muted for autoplay
         Check browser console for errors
```

### Backend Errors?
```
Problem: "Cloudinary upload failed"
Solution: Verify CLOUDINARY_* env variables
         Check Cloudinary account is active
```

---

## 📝 Quick Test Checklist

After setup, verify:

- [ ] Backend runs without errors (`npm start`)
- [ ] Frontend runs without errors (`npm run dev`)
- [ ] Can login to admin panel
- [ ] Can upload PDF + Video
- [ ] Document appears in list
- [ ] Can view flipbook
- [ ] Pages flip smoothly
- [ ] Hyperlinks work (if PDF has links)
- [ ] Video autoplays and loops
- [ ] Keyboard navigation works
- [ ] Mobile responsive (test on phone)

---

## 🎯 Expected Behavior

### On Upload:
1. User selects PDF and Video files
2. Files upload to Cloudinary
3. PDF stored as **raw file** (not images)
4. Document status changes to "active"
5. Success message appears

### On View:
1. PDF loads using PDF.js
2. First page displays
3. Flipbook interface appears
4. User can flip pages (click, keys, swipe)
5. Hyperlinks are clickable
6. Video (if present) appears as last page
7. Video auto-plays and loops

---

## 💡 Pro Tips

### For Best Results:
- Use PDFs with embedded hyperlinks
- Keep PDFs under 50 pages for fast loading
- Use web-optimized video formats (MP4)
- Test on multiple browsers
- Test on mobile devices

### For Testing Hyperlinks:
Create a test PDF with links using:
- Microsoft Word (Insert → Link)
- Google Docs (Insert → Link)
- Adobe Acrobat
- Online PDF editors

---

## 🔗 Useful URLs

**Local Development:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Admin Login: http://localhost:5173/admin/login

**Cloudinary:**
- Dashboard: https://cloudinary.com/console
- Media Library: https://cloudinary.com/console/media_library

---

## ✨ What's Different Now?

| Before | After |
|--------|-------|
| PDF → Images | PDF → Raw File |
| No hyperlinks | ✅ Hyperlinks work |
| No text selection | ✅ Text selectable |
| Slow upload | ⚡ Fast upload |
| More storage | 💾 Less storage |
| Static images | 📄 Interactive PDF |

---

## 🆘 Need Help?

**Console Errors?**
- Open browser DevTools (F12)
- Check Console tab for errors
- Look for CORS or network errors

**Backend Errors?**
- Check terminal where backend runs
- Look for Cloudinary or MongoDB errors

**Still Not Working?**
1. Check environment variables
2. Verify Cloudinary CORS
3. Test with simple PDF
4. Review IMPLEMENTATION_SUMMARY.md

---

**Last Updated:** January 5, 2026  
**Status:** Ready for Testing ✅
