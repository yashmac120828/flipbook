import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicAPI } from '../services/api';
import toast from 'react-hot-toast';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import PDFPageRenderer from '../components/PDFPageRenderer';
import LoopingVideo from '../components/LoopingVideo';
import PreviewVideo from '../components/PreviewVideo';

// Set worker path for PDF.js - using local worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

const FlipbookViewer = () => {
  const { slug, id } = useParams(); // Support both /viewer/:slug and /view/:id
  const navigate = useNavigate();
  
  const [flipbookDoc, setFlipbookDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', mobile: '' });
  const [sessionId, setSessionId] = useState(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [pageWidth, setPageWidth] = useState(550);
  const [pageHeight, setPageHeight] = useState(733);

  // Determine which identifier to use (support both slug and ID)
  const documentIdentifier = slug || id;

  useEffect(() => {
    if (documentIdentifier) {
      fetchDocument();
    }
  }, [documentIdentifier]);

  // Load PDF when document is fetched
  useEffect(() => {
    if (flipbookDoc?.files?.pdf?.original?.url) {
      loadPDF();
    }
    
    // Check for video
    if (flipbookDoc?.files?.video?.original?.url) {
      setHasVideo(true);
      setVideoUrl(flipbookDoc.files.video.original.url);
    }
  }, [flipbookDoc]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await publicAPI.getDocument(documentIdentifier);
      
      if (!response.error) {
        if (response.status === 'processing') {
          setError('Document is not active');
          setTimeout(() => fetchDocument(), 5000);
          return;
        }
        
        setFlipbookDoc(response);
        trackView();
        
        if (response.requireContact) {
          setIsContactModalOpen(true);
        }
      } else {
        setError(response.error || 'Document not found');
        
        if (response.error === 'Document is not active') {
          setTimeout(() => fetchDocument(), 5000);
        }
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadPDF = async () => {
    try {
      if (!flipbookDoc?.files?.pdf?.original?.url) {
        console.error('❌ No PDF URL found in document structure');
        console.error('Document structure:', flipbookDoc);
        toast.error('PDF file not found');
        return;
      }

      const pdfUrl = flipbookDoc.files.pdf.original.url;
      console.log('🔄 Loading PDF from Cloudinary...');
      console.log('📄 PDF URL:', pdfUrl);
      console.log('🔧 Resource Type:', flipbookDoc.files.pdf.original.resourceType);
      
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      });

      console.log('⏳ PDF loading task started...');
      const pdf = await loadingTask.promise;
      console.log('✅ PDF loaded successfully!');
      console.log('📊 Total pages:', pdf.numPages);
      console.log('🔍 PDF fingerprint:', pdf.fingerprint);
      
      // Get first page to determine dimensions
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      
      // Calculate responsive dimensions based on screen size
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      // Set max width based on device
      let maxWidth;
      if (isMobile) {
        maxWidth = Math.min(window.innerWidth - 32, 500); // Mobile: full width minus padding
      } else if (isTablet) {
        maxWidth = 600; // Tablet
      } else {
        maxWidth = 800; // Desktop
      }
      
      // Calculate scale and dimensions
      const scale = maxWidth / viewport.width;
      const calculatedWidth = viewport.width * scale;
      const calculatedHeight = viewport.height * scale;
      
      // Limit height for better UX (max 80vh per page)
      const maxHeight = window.innerHeight * 0.8;
      let finalWidth = calculatedWidth;
      let finalHeight = calculatedHeight;
      
      if (calculatedHeight > maxHeight) {
        const heightScale = maxHeight / calculatedHeight;
        finalWidth = calculatedWidth * heightScale;
        finalHeight = maxHeight;
      }
      
      setPageWidth(Math.round(finalWidth));
      setPageHeight(Math.round(finalHeight));
      
      console.log('📐 PDF Page Dimensions:', {
        originalWidth: viewport.width,
        originalHeight: viewport.height,
        displayWidth: Math.round(calculatedWidth),
        displayHeight: Math.round(calculatedHeight)
      });
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      
      console.log('🎉 PDF ready for rendering with PDF.js!');
      console.log('🔗 Hyperlinks will be preserved');
      console.log('📝 Text will be selectable');
      
    } catch (error) {
      console.error('❌ Error loading PDF:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      if (error.name === 'PasswordException') {
        toast.error('This PDF is password protected');
      } else if (error.message.includes('CORS')) {
        toast.error('CORS error - please configure Cloudinary CORS settings');
        console.error('🔧 Check CLOUDINARY_CORS.md for setup instructions');
      } else {
        toast.error('Failed to load PDF document');
      }
    }
  };

  const trackView = async () => {
    try {
      const viewResponse = await publicAPI.trackView(documentIdentifier, {
        sessionId: sessionId || undefined
      });
      
      if (viewResponse.success) {
        setSessionId(viewResponse.sessionId);
        
        if (viewResponse.requireContact && !isContactModalOpen) {
          setIsContactModalOpen(true);
        }
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    if (!contactForm.name.trim() || !contactForm.mobile.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await publicAPI.submitContact(documentIdentifier, {
        sessionId,
        name: contactForm.name.trim(),
        mobile: contactForm.mobile.trim()
      });

      if (response.data.success) {
        toast.success('Contact information submitted successfully!');
        setIsContactModalOpen(false);
        setContactForm({ name: '', mobile: '' });
      } else {
        toast.error(response.data.message || 'Failed to submit contact information');
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
      toast.error('Failed to submit contact information');
    }
  };

  const handleDownload = async () => {
    try {
      if (!flipbookDoc?.files?.pdf?.original?.url) {
        toast.error('PDF file not available for download');
        return;
      }

      // Get the PDF URL from the document
      const pdfUrl = flipbookDoc.files.pdf.original.url;
      const fileName = flipbookDoc.title ? `${flipbookDoc.title}.pdf` : 'document.pdf';
      
      // Create a temporary link and click it to start download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl animate-pulse"></div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">Loading document...</h2>
          <p className="text-gray-400">Preparing your flipbook experience</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Special handling for processing status
    if (error === 'Document is not active') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          </div>
          <div className="text-center relative z-10 max-w-md mx-auto p-8">
            <div className="relative mb-8">
              <div className="animate-spin rounded-full h-24 w-24 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
              <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl animate-pulse"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">Document Processing</h1>
            <p className="text-gray-300 mb-8 text-lg">This document is being prepared. Please check back in a few moments.</p>
            <button
              onClick={() => {
                setTimeout(() => window.location.reload(), 5000);
                fetchDocument();
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 font-semibold transform hover:scale-105"
            >
              Refresh Status
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        </div>
        <div className="text-center relative z-10 max-w-md mx-auto p-8">
          <div className="text-8xl mb-6 animate-bounce">📄</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-300 to-pink-300 bg-clip-text text-transparent mb-4">Document Not Found</h1>
          <p className="text-gray-300 mb-8 text-lg">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 font-semibold transform hover:scale-105"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const effectiveTotalPages = totalPages + (hasVideo ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/')}
                className="group flex items-center space-x-2 text-gray-300 hover:text-white transition-all duration-300 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm"
                title="Back to Home"
              >
                <svg className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
              
              <div className="hidden md:block h-8 w-px bg-white/20"></div>
              
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent truncate max-w-md">
                {flipbookDoc.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-6">
              {pdfDoc && totalPages > 0 && (
                <div className="hidden sm:flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <svg className="w-5 h-5 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white font-semibold">
                    {effectiveTotalPages} {effectiveTotalPages === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>
              )}
              
              {flipbookDoc.allowDownload && (
                <button
                  onClick={handleDownload}
                  className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-green-500/50 font-semibold flex items-center space-x-2 transform hover:scale-105"
                  title="Download Document"
                >
                  <svg className="w-5 h-5 transform group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          
          {pdfDoc ? (
            <div className="document-container space-y-4 md:space-y-8">
              {/* PDF Pages - Vertical Stack */}
              <div className="space-y-4 md:space-y-6">
                {Array.from({ length: totalPages }, (_, i) => (
                  <div 
                    key={`page-${i + 1}`} 
                    className="bg-white shadow-lg md:shadow-2xl rounded-lg md:rounded-xl overflow-hidden mx-auto transform transition-all duration-300 hover:shadow-xl"
                    style={{ 
                      width: '100%', 
                      maxWidth: `${pageWidth}px`
                    }}
                  >
                    <PDFPageRenderer
                      pdfDoc={pdfDoc}
                      pageNumber={i + 1}
                      width={pageWidth}
                      height={pageHeight}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
              
              {/* Video Section - Below PDF */}
              {hasVideo && (
                <div 
                  className="bg-black shadow-lg md:shadow-2xl rounded-lg md:rounded-xl overflow-hidden mx-auto transform transition-all duration-300 hover:shadow-xl" 
                  style={{ 
                    width: '100%', 
                    maxWidth: `${pageWidth}px`
                  }}
                >
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <PreviewVideo
                      src={videoUrl}
                      flipbookId={flipbookDoc._id}
                      sessionId={sessionId}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 space-y-6 bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600"></div>
                <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse"></div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">Loading PDF...</p>
                <p className="text-gray-400">Please wait while we prepare your document</p>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information Required
              </h3>
              <p className="text-gray-600 mb-6">
                Please provide your contact information to continue viewing this document.
              </p>
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    value={contactForm.mobile}
                    onChange={(e) => setContactForm(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your mobile number"
                    required
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Continue
                  </button>
                  {!flipbookDoc.requireContact && (
                    <button
                      type="button"
                      onClick={() => setIsContactModalOpen(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlipbookViewer;