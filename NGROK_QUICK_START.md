# 🚀 NGROK QUICK REFERENCE

## ⚡ EASIEST METHOD - Use Existing Terminals

### Terminal 1 - Backend (node terminal)
```powershell
cd backend
node server.js
```
✅ Keep this running

### Terminal 2 - Frontend (esbuild terminal)
```powershell
cd frontend
npm run dev
```
✅ Keep this running

### Terminal 3 - Ngrok (NEW PowerShell)
**Open a NEW PowerShell terminal** and run:
```powershell
cd C:\Users\Admin\Desktop\Flipbook
ngrok http 3000
```

⚠️ **DO NOT CLOSE THIS WINDOW!**

You'll see:
```
Session Status: online
Forwarding: https://abc123-xyz.ngrok.app -> http://localhost:3000
```

👆 **COPY this https URL** (select and right-click to copy)

---

## Update Config

### 1. Open `.env` file
```powershell
cd frontend
notepad .env
```

### 2. Paste your ngrok URL
Change this line:
```env
VITE_PUBLIC_URL=https://YOUR-NGROK-URL.ngrok.app
```

Example:
```env
VITE_PUBLIC_URL=https://abc123-xyz.ngrok.app
```

### 3. Save and close Notepad

### 4. Restart Frontend (Terminal 2)
1. Press `Ctrl+C` to stop
2. Run again:
```powershell
npm run dev
```

---

## ✅ Done!

Now your QR codes will use the ngrok URL!

**Test it:**
1. Open admin dashboard → Documents
2. Click "QR Code" on any document  
3. Scan with your phone
4. Works from anywhere! 🎉

---

## 📱 Alternative - Use the .bat file

⚠️ **Note:** The batch file will open a new window that stays open.

1. Double-click: `start-ngrok.bat`
2. Copy the https URL from the window
3. Update `.env` as shown above
4. Restart frontend

---

## 🔴 Important Rules

1. **Keep ngrok window OPEN** - closing it stops the tunnel
2. **New URL each time** - free plan gives you a new URL when you restart
3. **Update .env each time** - paste the new URL and restart frontend
