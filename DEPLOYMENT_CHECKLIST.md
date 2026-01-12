# 🚀 Quick Deployment Checklist

## Before You Start
- [ ] GitHub account created
- [ ] Repository pushed to GitHub
- [ ] MongoDB Atlas database is accessible

---

## Backend Deployment (Render)

### 1️⃣ Deploy to Render
```
✓ Go to render.com
✓ New Web Service
✓ Connect GitHub repo
✓ Root directory: backend
✓ Build: npm install
✓ Start: node server.js
```

### 2️⃣ Environment Variables
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://flipUser:TFxw92DcZPNWoauf@cluster0.nuz5b2l.mongodb.net/flipbook
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
CLOUDINARY_CLOUD_NAME=dhzqbwd3r
CLOUDINARY_API_KEY=643519117372385
CLOUDINARY_API_SECRET=FWJYZoVmScg56AQfP8GwtfnL9S8
FRONTEND_URL=(add after frontend deploy)
ALLOWED_ORIGINS=(add after frontend deploy)
```

### 3️⃣ Copy Backend URL
```
https://flipbook-backend-xxxx.onrender.com
```

---

## Frontend Deployment (Vercel)

### 1️⃣ Deploy to Vercel
```
✓ Go to vercel.com
✓ Import GitHub repo
✓ Framework: Vite
✓ Root directory: frontend
✓ Build: npm run build
✓ Output: dist
```

### 2️⃣ Environment Variables
```
VITE_PUBLIC_URL=https://your-app.vercel.app
VITE_API_URL=https://flipbook-backend-xxxx.onrender.com
```

### 3️⃣ Copy Frontend URL
```
https://your-app.vercel.app
```

---

## Final Step: Update Backend CORS

Go back to Render → Environment:
```
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Save → Backend auto-redeploys

---

## ✅ Done!

Test:
- Frontend: https://your-app.vercel.app
- Admin: https://your-app.vercel.app/admin/login
- Backend API: https://flipbook-backend-xxxx.onrender.com/api/auth/me

---

## 📱 Generate QR Codes

1. Login to admin
2. Upload document
3. Click "QR Code"
4. Share!

QR codes will use: `https://your-app.vercel.app/view/{docId}`
