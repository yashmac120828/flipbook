# Cloudinary CORS Configuration

## Important: CORS Setup for PDF.js

Since PDF.js loads PDFs directly from Cloudinary URLs, you need to ensure Cloudinary allows CORS requests.

### Cloudinary CORS Settings

1. **Log in to Cloudinary Dashboard**: https://cloudinary.com/console
2. **Navigate to**: Settings → Security
3. **Add Allowed Domains** under "CORS Settings":
   - `http://localhost:5173` (for development)
   - `http://localhost:3000` (alternative dev port)
   - Your production domain (e.g., `https://yourdomain.com`)
   - Or use `*` for all domains (not recommended for production)

### Alternative: Use Signed URLs

If you need more security, you can use signed URLs:

```javascript
// In backend/services/cloudinary.js
const cloudinary = require('cloudinary').v2;

function getSignedUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    ...options,
    sign_url: true,
    type: 'authenticated'
  });
}
```

### Testing CORS

You can test if CORS is working by:

1. Open browser DevTools
2. Load a flipbook document
3. Check Console for CORS errors
4. If you see errors like:
   ```
   Access to fetch at 'https://res.cloudinary.com/...' from origin 'http://localhost:5173' 
   has been blocked by CORS policy
   ```
   Then CORS needs to be configured in Cloudinary.

### PDF.js Specific Configuration

Our implementation uses:
```javascript
const loadingTask = pdfjsLib.getDocument({
  url: document.files.pdf.original.url,
  cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
  cMapPacked: true
  // No withCredentials - uses CORS
});
```

### Troubleshooting

**Issue**: PDF won't load
**Solution**: 
1. Check Cloudinary CORS settings
2. Verify PDF URL is accessible
3. Check browser console for errors

**Issue**: "Range requests not supported"
**Solution**: Cloudinary supports range requests by default for raw files

**Issue**: Slow loading
**Solution**: 
1. Use CDN URL (already using res.cloudinary.com)
2. Enable Cloudinary auto-format
3. Consider implementing lazy loading
