# 🚀 Deployment Guide - Vercel + Render

## Overview
- **Frontend:** Vercel (Free)
- **Backend:** Render (Free tier)
- **Database:** MongoDB Atlas (Already setup)

---

## 📦 Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to: https://render.com
2. Sign up with GitHub account
3. Authorize GitHub access

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `flipbook-backend` (or any name)
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

### Step 3: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**, add these:

```
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://flipUser:TFxw92DcZPNWoauf@cluster0.nuz5b2l.mongodb.net/flipbook
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=dhzqbwd3r
CLOUDINARY_API_KEY=643519117372385
CLOUDINARY_API_SECRET=FWJYZoVmScg56AQfP8GwtfnL9S8
CLOUDINARY_FOLDER=flipbook
FRONTEND_URL=https://your-app-name.vercel.app
ALLOWED_ORIGINS=https://your-app-name.vercel.app,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

**Note:** You'll update `FRONTEND_URL` and `ALLOWED_ORIGINS` after deploying frontend.

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. **Copy your backend URL:** `https://flipbook-backend-xxxx.onrender.com`

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to: https://vercel.com
2. Sign up with GitHub account
3. Authorize GitHub access

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your Flipbook repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 3: Add Environment Variables
Click **"Environment Variables"**, add these:

```
VITE_PUBLIC_URL=https://your-app-name.vercel.app
VITE_API_URL=https://flipbook-backend-xxxx.onrender.com
```

**Replace:**
- `your-app-name.vercel.app` with your actual Vercel URL
- `flipbook-backend-xxxx.onrender.com` with your Render backend URL

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for deployment (2-3 minutes)
3. **Copy your frontend URL:** `https://your-app-name.vercel.app`

---

## 🔄 Part 3: Update Backend CORS

### Go back to Render:
1. Go to your backend service
2. Click **"Environment"** tab
3. Update these variables:

```
FRONTEND_URL=https://your-app-name.vercel.app
ALLOWED_ORIGINS=https://your-app-name.vercel.app,http://localhost:3000
```

4. Click **"Save Changes"**
5. Backend will auto-redeploy

---

## ✅ Part 4: Test Your Deployment

### 1. Test Backend
Visit: `https://flipbook-backend-xxxx.onrender.com/api/auth/me`

Should see:
```json
{"success":false,"message":"Access denied. No token provided."}
```
(This is correct - it means backend is working!)

### 2. Test Frontend
Visit: `https://your-app-name.vercel.app`

Should see your homepage!

### 3. Test Login
1. Go to: `https://your-app-name.vercel.app/admin/login`
2. Login with: `admin@flipbook.com` / `admin123`
3. Should redirect to dashboard

### 4. Generate QR Code
1. Upload a document
2. Click "QR Code" button
3. QR code will use your Vercel URL! 🎉

---

## 📱 Now Share with QR Codes!

Your QR codes will generate URLs like:
```
https://your-app-name.vercel.app/view/DOCUMENT_ID
```

Anyone can scan and view! 🚀

---

## ⚠️ Important Notes

### Render Free Tier Limitations:
- ⏰ Service spins down after 15 minutes of inactivity
- 🐌 First request after spin-down takes 30-60 seconds
- ✅ Perfect for demos and testing
- 💰 Upgrade to paid plan ($7/month) for always-on service

### Vercel Free Tier:
- ✅ Always fast
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Perfect for production

---

## 🔧 Troubleshooting

### Backend not working?
- Check Render logs: Service → Logs tab
- Verify all environment variables are set
- Make sure PORT=8000

### CORS errors?
- Verify `ALLOWED_ORIGINS` includes your Vercel URL
- Check `FRONTEND_URL` is correct
- Redeploy backend after changes

### Frontend not connecting to backend?
- Check `VITE_API_URL` points to Render backend
- Verify backend is running (not spun down)
- Check Network tab for exact error

---

## 🎉 You're Live!

Your flipbook app is now:
- ✅ Deployed to production
- ✅ Accessible worldwide
- ✅ Ready to share via QR codes
- ✅ Free to use!

**Next Steps:**
1. Upload your documents
2. Generate QR codes
3. Share with clients! 📱

---

## 💡 Optional: Custom Domain

### Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records
4. Done! ✅

### Render:
1. Upgrade to paid plan ($7/month)
2. Go to Settings → Custom Domain
3. Add your domain
4. Update DNS records

---

**Need help?** Check the logs in Render/Vercel dashboards!
