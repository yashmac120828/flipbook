#!/usr/bin/env node

/**
 * Test script to verify PDF.js implementation
 * Run: node test-pdfjs-setup.js
 */

console.log('\n🧪 Testing PDF.js Flipbook Setup\n');
console.log('='.repeat(50));

// 1. Check if required packages are installed
console.log('\n1️⃣ Checking Dependencies...');

try {
  const pdfjsPackage = require('../frontend/package.json').dependencies['pdfjs-dist'];
  const pageflipPackage = require('../frontend/package.json').dependencies['react-pageflip'];
  
  console.log(`   ✅ pdfjs-dist: ${pdfjsPackage}`);
  console.log(`   ✅ react-pageflip: ${pageflipPackage}`);
} catch (error) {
  console.log(`   ❌ Error reading package.json:`, error.message);
}

// 2. Check if components exist
console.log('\n2️⃣ Checking Components...');

const fs = require('fs');
const path = require('path');

const componentsToCheck = [
  '../frontend/src/components/PDFPageRenderer.jsx',
  '../frontend/src/components/LoopingVideo.jsx',
  '../frontend/src/pages/FlipbookViewer.jsx'
];

componentsToCheck.forEach(comp => {
  const filePath = path.join(__dirname, comp);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${path.basename(comp)}`);
  } else {
    console.log(`   ❌ ${path.basename(comp)} not found`);
  }
});

// 3. Check environment variables
console.log('\n3️⃣ Checking Environment Variables...');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'MONGODB_URI',
  'JWT_SECRET'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar}: Set`);
  } else {
    console.log(`   ❌ ${envVar}: Missing`);
  }
});

// 4. Check Cloudinary service
console.log('\n4️⃣ Checking Cloudinary Service...');

try {
  const cloudinaryService = fs.readFileSync(
    path.join(__dirname, 'services/cloudinary.js'),
    'utf8'
  );
  
  if (cloudinaryService.includes('resourceType: \'raw\'')) {
    console.log(`   ✅ PDF uploaded as RAW (no image conversion)`);
  } else {
    console.log(`   ⚠️  Warning: Check if PDFs are uploaded as raw files`);
  }
  
  if (cloudinaryService.includes('PDF.js will render pages client-side')) {
    console.log(`   ✅ PDF.js rendering enabled`);
  } else {
    console.log(`   ⚠️  Warning: Check PDF.js implementation`);
  }
} catch (error) {
  console.log(`   ❌ Error reading cloudinary.js:`, error.message);
}

// 5. Check FlipbookViewer implementation
console.log('\n5️⃣ Checking FlipbookViewer...');

try {
  const viewer = fs.readFileSync(
    path.join(__dirname, '../frontend/src/pages/FlipbookViewer.jsx'),
    'utf8'
  );
  
  if (viewer.includes('PDFPageRenderer')) {
    console.log(`   ✅ Uses PDFPageRenderer component`);
  } else {
    console.log(`   ❌ PDFPageRenderer not imported`);
  }
  
  if (viewer.includes('HTMLFlipBook')) {
    console.log(`   ✅ Uses react-pageflip`);
  } else {
    console.log(`   ❌ HTMLFlipBook not imported`);
  }
  
  if (viewer.includes('pdfjsLib.getDocument')) {
    console.log(`   ✅ Loads PDF with PDF.js`);
  } else {
    console.log(`   ❌ PDF.js loading not found`);
  }
} catch (error) {
  console.log(`   ❌ Error reading FlipbookViewer.jsx:`, error.message);
}

// 6. Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 Summary:');
console.log('\n✅ If all checks pass:');
console.log('   1. Start backend: cd backend && npm start');
console.log('   2. Start frontend: cd frontend && npm run dev');
console.log('   3. Upload a new PDF via admin panel');
console.log('   4. View it - should render with PDF.js!');
console.log('\n⚠️  If CORS errors occur:');
console.log('   1. Configure Cloudinary CORS settings');
console.log('   2. See CLOUDINARY_CORS.md for instructions');
console.log('\n🔧 For troubleshooting:');
console.log('   - Check browser console for detailed logs');
console.log('   - Look for 🔄, ✅, or ❌ emoji in logs');
console.log('   - See TESTING_GUIDE.md for full checklist\n');
