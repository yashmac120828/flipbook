# Testing Guide - PDF.js Flipbook

## Complete Testing Checklist

### 🔧 Pre-Testing Setup

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Cloudinary configured
- [ ] CORS enabled in Cloudinary
- [ ] Environment variables set

---

## 📋 Test Categories

### 1. PDF Upload & Storage

#### Test 1.1: Upload Simple PDF
**Steps:**
1. Login to admin panel
2. Go to Upload page
3. Select a simple PDF (1-5 pages, no links)
4. Add title and description
5. Click Upload

**Expected:**
- ✅ Upload completes successfully
- ✅ Success message appears
- ✅ Redirects to documents list
- ✅ Document shows "Active" status

**Verify in Cloudinary:**
- ✅ PDF uploaded as raw file (not images)
- ✅ Resource type is "raw"
- ✅ File format is "pdf"

#### Test 1.2: Upload PDF with Hyperlinks
**Steps:**
1. Create/download PDF with hyperlinks
2. Upload through admin panel
3. View the flipbook

**Expected:**
- ✅ Upload successful
- ✅ PDF renders correctly
- ✅ Hyperlinks visible (yellow hover)
- ✅ Clicking links opens new tab
- ✅ External links work

**Test PDFs with Hyperlinks:**
- Create in Word/Docs with Insert → Link
- Use sample PDFs from: pdftron.com, mozilla.org

#### Test 1.3: Upload Large PDF
**Steps:**
1. Upload PDF with 50+ pages
2. Monitor upload progress
3. View in flipbook

**Expected:**
- ✅ Upload completes (may take time)
- ✅ Progress bar shows correctly
- ✅ All pages render
- ✅ Navigation works smoothly

---

### 2. Video Upload & Playback

#### Test 2.1: Upload PDF + Video
**Steps:**
1. Upload PDF file
2. Upload video file (MP4)
3. Complete upload

**Expected:**
- ✅ Both files upload
- ✅ Video appears as last page
- ✅ Video autoplays
- ✅ Video loops continuously
- ✅ No controls visible

#### Test 2.2: Video Formats
**Test with:**
- [ ] MP4 format
- [ ] WebM format
- [ ] MOV format

**Expected:**
- ✅ MP4 works best
- ✅ WebM supported
- ⚠️ MOV may need conversion

#### Test 2.3: Video Behavior
**Verify:**
- [ ] Starts automatically
- [ ] Loops without stopping
- [ ] Muted by default
- [ ] No play/pause controls
- [ ] Cannot be paused by user
- [ ] Resumes after tab switch

---

### 3. PDF Rendering

#### Test 3.1: PDF.js Loading
**Steps:**
1. View a flipbook
2. Open browser DevTools
3. Watch console logs

**Expected:**
- ✅ "Loading PDF from: [URL]"
- ✅ "PDF loaded successfully, pages: X"
- ✅ No CORS errors
- ✅ No PDF.js errors

#### Test 3.2: Page Quality
**Verify:**
- [ ] Text is crisp and clear
- [ ] Images are sharp
- [ ] Colors are accurate
- [ ] No pixelation
- [ ] Better than JPEG quality

#### Test 3.3: Text Selection
**Steps:**
1. View flipbook
2. Try to select text on page
3. Copy selected text

**Expected:**
- ✅ Text is selectable
- ✅ Selection highlights
- ✅ Copy works (Ctrl+C)
- ✅ Pasted text matches original

---

### 4. Hyperlink Functionality

#### Test 4.1: External Links
**Steps:**
1. View PDF with external links
2. Hover over link
3. Click link

**Expected:**
- ✅ Yellow highlight on hover
- ✅ Cursor changes to pointer
- ✅ Opens in new tab
- ✅ Correct URL opens

#### Test 4.2: Internal Links
**If PDF has internal links (bookmarks):**
- [ ] Link navigates within PDF
- [ ] Correct page shown
- [ ] Flipbook follows navigation

#### Test 4.3: Email Links
**If PDF has mailto: links:**
- [ ] Opens email client
- [ ] Correct address populated

---

### 5. Flipbook Navigation

#### Test 5.1: Arrow Navigation
**Test:**
- [ ] Click right arrow → next page
- [ ] Click left arrow → previous page
- [ ] Arrow disabled at first page
- [ ] Arrow disabled at last page

#### Test 5.2: Keyboard Navigation
**Test:**
- [ ] Right arrow key → next page
- [ ] Left arrow key → previous page
- [ ] Down arrow key → next page
- [ ] Up arrow key → previous page

#### Test 5.3: Thumbnail Navigation
**Steps:**
1. Scroll thumbnail bar
2. Click thumbnail
3. Verify page shown

**Expected:**
- ✅ Jumps to clicked page
- ✅ Current page highlighted
- ✅ Video thumbnail shows play icon

#### Test 5.4: Page Flip Animation
**Verify:**
- [ ] Smooth page turn
- [ ] Realistic shadow effect
- [ ] Page curl animation
- [ ] ~1 second duration

---

### 6. Mobile Responsiveness

#### Test 6.1: Mobile Layout
**Test on mobile device or Chrome DevTools:**
1. Toggle device toolbar
2. Select iPhone/Android
3. View flipbook

**Expected:**
- ✅ Flipbook fits screen
- ✅ Touch navigation works
- ✅ Swipe to flip pages
- ✅ Pinch to zoom
- ✅ Text readable

#### Test 6.2: Mobile Video
**Verify:**
- [ ] Video autoplays
- [ ] Video loops
- [ ] Video muted
- [ ] No controls shown

---

### 7. Cross-Browser Testing

#### Test 7.1: Chrome
- [ ] PDF renders
- [ ] Hyperlinks work
- [ ] Video autoplays
- [ ] Navigation smooth

#### Test 7.2: Firefox
- [ ] PDF renders
- [ ] Hyperlinks work
- [ ] Video autoplays
- [ ] Navigation smooth

#### Test 7.3: Safari
- [ ] PDF renders
- [ ] Hyperlinks work
- [ ] Video autoplays
- [ ] Navigation smooth

#### Test 7.4: Edge
- [ ] PDF renders
- [ ] Hyperlinks work
- [ ] Video autoplays
- [ ] Navigation smooth

---

### 8. Performance Testing

#### Test 8.1: Load Time
**Measure:**
- [ ] Time to first page render
- [ ] Total load time for 10-page PDF
- [ ] Total load time for 50-page PDF

**Expected:**
- ✅ First page < 2 seconds
- ✅ 10 pages < 5 seconds
- ✅ 50 pages < 10 seconds

#### Test 8.2: Memory Usage
**Monitor in DevTools:**
1. Open Performance tab
2. Start recording
3. Navigate through flipbook
4. Stop recording

**Expected:**
- ✅ Memory stable
- ✅ No memory leaks
- ✅ Smooth animations

---

### 9. Error Handling

#### Test 9.1: CORS Errors
**Simulate:**
1. Remove domain from Cloudinary CORS
2. Try to view flipbook

**Expected:**
- ✅ Helpful error message
- ✅ Not just blank screen
- ⚠️ Console shows CORS error

#### Test 9.2: Missing Files
**Simulate:**
1. Delete PDF from Cloudinary
2. Try to view flipbook

**Expected:**
- ✅ Error message shown
- ✅ User notified
- ✅ Graceful failure

#### Test 9.3: Network Errors
**Simulate:**
1. Throttle network to "Slow 3G"
2. View flipbook

**Expected:**
- ✅ Loading indicator shown
- ✅ Eventually loads
- ✅ No crashes

---

### 10. Analytics Tracking

#### Test 10.1: View Tracking
**Steps:**
1. View a document
2. Check admin analytics

**Expected:**
- ✅ View count increases
- ✅ Session ID generated
- ✅ Device info captured
- ✅ Timestamp recorded

#### Test 10.2: Contact Collection
**If enabled:**
- [ ] Modal appears
- [ ] Form validates
- [ ] Data saves
- [ ] Appears in analytics

---

## 🐛 Common Issues & Solutions

### Issue: PDF won't load
**Check:**
- [ ] Cloudinary CORS configured?
- [ ] PDF URL accessible?
- [ ] Console errors?
- [ ] Network tab in DevTools

### Issue: Hyperlinks not clickable
**Check:**
- [ ] PDF has hyperlinks?
- [ ] Annotation layer CSS loaded?
- [ ] Console errors?
- [ ] Z-index issues?

### Issue: Video won't autoplay
**Check:**
- [ ] Video is muted?
- [ ] Browser allows autoplay?
- [ ] Video format supported?
- [ ] Console errors?

### Issue: Flipbook not smooth
**Check:**
- [ ] PDF too large?
- [ ] Slow network?
- [ ] Browser performance?
- [ ] React DevTools profiling

---

## 📊 Test Results Template

```
Test Date: __________
Tester: __________
Environment: Development / Staging / Production

✅ = Pass
❌ = Fail
⚠️ = Partial

| Test Category        | Status | Notes |
|---------------------|--------|-------|
| PDF Upload          |        |       |
| Video Upload        |        |       |
| PDF Rendering       |        |       |
| Hyperlinks          |        |       |
| Navigation          |        |       |
| Mobile              |        |       |
| Cross-Browser       |        |       |
| Performance         |        |       |
| Error Handling      |        |       |
| Analytics           |        |       |

Overall Status: ✅ / ❌ / ⚠️
```

---

## 🎯 Critical Tests (Must Pass)

**Before deploying to production, ensure these pass:**

1. ✅ PDF uploads successfully
2. ✅ PDF renders with hyperlinks
3. ✅ Hyperlinks are clickable
4. ✅ Video autoplays and loops
5. ✅ Video has no controls
6. ✅ Mobile navigation works
7. ✅ No CORS errors
8. ✅ Text is selectable
9. ✅ All browsers supported
10. ✅ Performance acceptable

---

## 📝 Test Data

### Sample PDFs to Test:
1. **Simple PDF**: 1-5 pages, no links
2. **With Hyperlinks**: PDF with external links
3. **With Images**: PDF with embedded images
4. **Large PDF**: 50+ pages
5. **Complex**: Tables, fonts, colors

### Sample Videos:
1. **Short**: 10-30 seconds
2. **Medium**: 1-2 minutes
3. **Long**: 5+ minutes
4. **Different formats**: MP4, WebM

---

**Last Updated:** January 5, 2026  
**Version:** 1.0 - PDF.js Implementation
