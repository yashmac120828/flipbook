# 🌐 NGROK SETUP GUIDE - Make Your Localhost Live!

## 📋 What is Ngrok?

Ngrok creates a secure public URL that tunnels to your localhost, allowing **anyone** to access your local development server from anywhere in the world.

```
Client Phone → https://abc123.ngrok.app → Your Localhost:3000
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Ngrok
Already done! ✅ Ngrok is installed globally.

### Step 2: Start Your Backend Server
```powershell
cd backend
node server.js
```
Backend should run on: `http://localhost:8000`

### Step 3: Start Your Frontend
```powershell
cd frontend
npm run dev
```
Frontend should run on: `http://localhost:3000`

### Step 4: Start Ngrok for Frontend
Open a **NEW terminal** and run:
```powershell
ngrok http 3000
```

You'll see output like:
```
Session Status: online
Forwarding: https://abc123-xyz.ngrok.app -> http://localhost:3000
```

### Step 5: Update Frontend Environment Variable

1. Open `frontend/.env`
2. Update `VITE_PUBLIC_URL`:
```env
VITE_PUBLIC_URL=https://abc123-xyz.ngrok.app
```
⚠️ **Replace `abc123-xyz` with YOUR actual ngrok URL**

3. **RESTART** the frontend server:
```powershell
# Press Ctrl+C to stop
# Then restart:
npm run dev
```

### Step 6: (Optional) Expose Backend with Ngrok

If your frontend needs to access the backend from the ngrok URL:

Open **another terminal**:
```powershell
ngrok http 8000
```

You'll get a backend URL like:
```
https://def456-abc.ngrok.app
```

Update `frontend/.env`:
```env
VITE_API_URL=https://def456-abc.ngrok.app
```

And `backend/.env`:
```env
FRONTEND_URL=https://abc123-xyz.ngrok.app
```

**RESTART both servers** after changing `.env` files.

---

## 📱 Testing the Live URL

### Generate QR Code
1. Go to your admin dashboard
2. Click "QR Code" button on any document
3. The QR code will now use your **ngrok URL**!

### Share the Link
Copy the URL and send via:
- WhatsApp ✅
- Email ✅
- SMS ✅
- Any messaging app ✅

Example:
```
https://abc123-xyz.ngrok.app/view/VOTPWsReqo
```

---

## ⚠️ Important Notes

### 1. URL Changes Every Time (Free Plan)
- Every time you restart ngrok, you get a **new URL**
- You must update `.env` and restart servers
- For permanent URLs, upgrade to ngrok Pro ($8/month)

### 2. Security
- Free ngrok URLs are **PUBLIC** - anyone with the link can access
- Don't share sensitive data
- Perfect for demos and testing

### 3. Session Expires
- Free sessions last **2 hours**
- After 2 hours, restart ngrok to get a new session

---

## 🎯 Complete Workflow

```powershell
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Ngrok Frontend
ngrok http 3000

# Copy the https URL from ngrok output
# Update frontend/.env with VITE_PUBLIC_URL
# Restart Terminal 2 (Ctrl+C then npm run dev)

# Now generate QR codes - they'll use ngrok URL!
```

---

## 🔄 Daily Usage

Every time you want to share:

1. Start backend
2. Start frontend
3. Start ngrok: `ngrok http 3000`
4. Copy new URL
5. Update `frontend/.env` → `VITE_PUBLIC_URL`
6. Restart frontend
7. Generate QR codes and share!

---

## 💡 Pro Tips

### Save ngrok URL as alias (optional)
```powershell
# In PowerShell
Set-Alias -Name ng3000 -Value "ngrok http 3000"
```

### Check ngrok status
Visit: `http://localhost:4040`
- See all requests in real-time
- Debug traffic
- View response times

---

## 🆘 Troubleshooting

### QR Code still shows localhost?
- Did you update `VITE_PUBLIC_URL` in `.env`?
- Did you restart the frontend server?

### Client gets "Cannot connect"?
- Check ngrok is still running
- Check the URL hasn't expired (2 hour limit)
- Restart ngrok and update `.env`

### Backend errors?
- Make sure backend is running on port 8000
- If exposing backend with ngrok, update `VITE_API_URL`

---

## 📊 Example Configuration

**frontend/.env:**
```env
VITE_PUBLIC_URL=https://abc123-xyz.ngrok.app
VITE_API_URL=http://localhost:8000
```

**backend/.env:**
```env
FRONTEND_URL=https://abc123-xyz.ngrok.app
PORT=8000
```

---

## ✅ Success Checklist

- [ ] Ngrok installed globally
- [ ] Backend running on localhost:8000
- [ ] Frontend running on localhost:3000
- [ ] Ngrok running: `ngrok http 3000`
- [ ] `.env` updated with ngrok URL
- [ ] Frontend restarted after `.env` change
- [ ] QR code generated with ngrok URL
- [ ] Tested on mobile phone
- [ ] Link works from different network

---

## 🎉 You're Ready!

Your flipbook is now **LIVE** and accessible from anywhere in the world!

Share the QR codes with clients, test on mobile devices, and show off your work! 🚀
