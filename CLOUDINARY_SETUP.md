# Cloudinary Setup Guide for Flipbook App

## 🚀 Why Cloudinary?

Cloudinary is perfect for the Flipbook app because it provides:
- **Automatic PDF to Image conversion** - Perfect for flipbook pages
- **Video processing and optimization** - Multiple formats, thumbnails, compression  
- **Global CDN delivery** - Fast loading worldwide
- **On-the-fly transformations** - Resize, crop, optimize images automatically
- **Free tier** - Generous limits for development and small projects

## 📝 Step-by-Step Setup

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **"Sign up for free"**
3. Choose **"Developer"** plan (free)
4. Verify your email

### 2. Get Your Credentials
After logging in to your Cloudinary dashboard:

1. Go to **Dashboard** (main page)
2. You'll see your credentials in the **"Account Details"** section:
   ```
   Cloud name: your-cloud-name
   API Key: 123456789012345
   API Secret: abcdefghijklmnopqrstuvwxyz123456
   ```

### 3. Update Your .env File
Replace the placeholders in your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_FOLDER=flipbook
```

### 4. Test Your Setup
Start your backend server and try uploading a PDF + Video. Cloudinary will:
- ✅ Store your original PDF
- ✅ Extract each PDF page as high-quality images  
- ✅ Generate thumbnails for flipbook navigation
- ✅ Process videos in multiple formats (MP4, WebM)
- ✅ Create video thumbnails
- ✅ Provide CDN URLs for fast delivery

## 🎯 Cloudinary Features for Flipbook

### PDF Processing
```javascript
// Cloudinary automatically extracts PDF pages
// Page 1: https://res.cloudinary.com/your-cloud/image/upload/v123/flipbook/pdfs/doc123.jpg?page=1
// Page 2: https://res.cloudinary.com/your-cloud/image/upload/v123/flipbook/pdfs/doc123.jpg?page=2
```

### Video Processing  
```javascript
// Multiple formats automatically generated:
// MP4: https://res.cloudinary.com/your-cloud/video/upload/flipbook/videos/vid123.mp4
// WebM: https://res.cloudinary.com/your-cloud/video/upload/flipbook/videos/vid123.webm
// Thumbnail: https://res.cloudinary.com/your-cloud/video/upload/flipbook/videos/vid123.jpg
```

### On-Demand Transformations
```javascript
// Resize PDF pages on-the-fly:
// Small: https://res.cloudinary.com/your-cloud/image/upload/w_400,h_600/flipbook/pdfs/doc123.jpg
// Large: https://res.cloudinary.com/your-cloud/image/upload/w_1200,h_1800/flipbook/pdfs/doc123.jpg
```

## 💰 Pricing (Free Tier Limits)
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month  
- **Transformations**: 25,000/month
- **Video processing**: 500 minutes/month

Perfect for development and small to medium applications!

## 🔧 Already Have AWS?
No problem! You can:
1. Keep existing AWS files and migrate gradually
2. Use Cloudinary for new uploads only
3. The app supports both through legacy URL fields

## 📞 Need Help?
- Cloudinary Docs: [cloudinary.com/documentation](https://cloudinary.com/documentation)
- Support: Available in your Cloudinary dashboard
- Community: Active developers on Stack Overflow

---

**Ready to test?** Just add your credentials to `.env` and start uploading! 🎉