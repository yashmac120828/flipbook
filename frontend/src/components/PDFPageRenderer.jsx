import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

/**
 * PDFPageRenderer - Renders a single PDF page with clickable hyperlinks
 * This component uses PDF.js to render PDF pages while preserving interactive elements
 */
const PDFPageRenderer = ({ pdfDoc, pageNumber, width, height, className = '', onPageRendered }) => {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const annotationLayerRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    if (!pdfDoc || !pageNumber) return;

    let isCancelled = false;
    let renderTask = null;

    const renderPage = async () => {
      try {
        setIsRendering(true);
        setRenderError(null);

        console.log(`🔄 Rendering PDF page ${pageNumber}...`);
        
        // Get the page
        const page = await pdfDoc.getPage(pageNumber);
        
        if (isCancelled) return;

        const canvas = canvasRef.current;
        const textLayer = textLayerRef.current;
        const annotationLayer = annotationLayerRef.current;

        if (!canvas || !textLayer || !annotationLayer) return;

        const context = canvas.getContext('2d');

        // Get page dimensions at scale 1
        const pageViewport = page.getViewport({ scale: 1 });
        
        // Use provided width, container width, or default
        const targetWidth = width || canvas.parentElement?.clientWidth || 600;
        
        // Calculate scale based on target width
        const baseScale = targetWidth / pageViewport.width;
        
        // Use device pixel ratio for high-quality rendering
        const pixelRatio = window.devicePixelRatio || 1;
        const scale = baseScale;
        
        const viewport = page.getViewport({ scale });
        
        console.log(`📐 Page ${pageNumber} viewport:`, { 
          width: viewport.width, 
          height: viewport.height, 
          scale, 
          pixelRatio,
          displayScale: baseScale 
        });
        
        // Set canvas internal dimensions (high resolution)
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Set canvas display dimensions (CSS size)
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        
        // Set scale factor for PDF.js CSS
        const displayWidth = viewport.width;
        const displayHeight = viewport.height;
        
        if (textLayer) {
          textLayer.style.setProperty('--scale-factor', baseScale.toString());
          textLayer.style.width = `${displayWidth}px`;
          textLayer.style.height = `${displayHeight}px`;
        }
        if (annotationLayer) {
          annotationLayer.style.setProperty('--scale-factor', baseScale.toString());
          annotationLayer.style.width = `${displayWidth}px`;
          annotationLayer.style.height = `${displayHeight}px`;
        }

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        // Render the page
        console.log(`🎨 Rendering page ${pageNumber} canvas...`);
        renderTask = page.render(renderContext);
        await renderTask.promise;

        if (isCancelled) return;

        console.log(`✅ Page ${pageNumber} canvas rendered`);

        // Render text layer for text selection and hyperlinks
        const textContent = await page.getTextContent();
        
        if (isCancelled) return;

        // Create a display viewport for text/annotation layers
        const displayViewport = page.getViewport({ scale: baseScale });

        // Clear and render text layer
        textLayer.innerHTML = '';
        console.log(`📝 Rendering page ${pageNumber} text layer...`);
        
        // Use correct API for pdfjs-dist v3+
        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer';
        textLayer.appendChild(textLayerDiv);
        
        // Render text content into divs
        textContent.items.forEach((item, index) => {
          const textDiv = document.createElement('div');
          textDiv.textContent = item.str;
          
          // Calculate position
          const tx = pdfjsLib.Util.transform(
            displayViewport.transform,
            item.transform
          );
          
          const style = textDiv.style;
          style.position = 'absolute';
          style.left = tx[4] + 'px';
          style.bottom = tx[5] + 'px';
          style.fontSize = Math.abs(tx[3]) + 'px';
          style.fontFamily = item.fontName;
          
          textLayerDiv.appendChild(textDiv);
        });

        // Render annotation layer (for hyperlinks and interactive elements)
        const annotations = await page.getAnnotations();
        
        if (isCancelled) return;

        // Clear previous annotation layer
        annotationLayer.innerHTML = '';

        // Render annotation layer
        if (annotations && annotations.length > 0) {
          console.log(`🔗 Page ${pageNumber} has ${annotations.length} annotations (hyperlinks)`);
          
          // Render annotations manually (compatible with PDF.js 3.x)
          annotations.forEach((annotation) => {
            if (annotation.subtype === 'Link' && annotation.url) {
              // Create a clickable link element
              const linkElement = document.createElement('a');
              linkElement.href = annotation.url;
              linkElement.target = '_blank';
              linkElement.rel = 'noopener noreferrer';
              
              // Transform annotation rectangle to display viewport coordinates
              const rect = displayViewport.convertToViewportRectangle(annotation.rect);
              const [x1, y1, x2, y2] = rect;
              
              // Calculate position and dimensions
              const left = Math.min(x1, x2);
              const top = Math.min(y1, y2);
              const width = Math.abs(x2 - x1);
              const height = Math.abs(y2 - y1);
              
              linkElement.style.position = 'absolute';
              linkElement.style.left = `${left}px`;
              linkElement.style.top = `${top}px`;
              linkElement.style.width = `${width}px`;
              linkElement.style.height = `${height}px`;
              linkElement.style.cursor = 'pointer';
              linkElement.style.border = 'none';
              linkElement.style.backgroundColor = 'transparent';
              linkElement.style.transition = 'all 0.2s';
              linkElement.style.pointerEvents = 'auto';
              linkElement.style.zIndex = '100';
              linkElement.title = annotation.url;
              
              // Add subtle hover effect
              linkElement.addEventListener('mouseenter', () => {
                linkElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
              });
              linkElement.addEventListener('mouseleave', () => {
                linkElement.style.backgroundColor = 'transparent';
              });
              
              annotationLayer.appendChild(linkElement);
            }
          });
          console.log(`✅ Page ${pageNumber} annotations rendered`);
        } else {
          console.log(`ℹ️ Page ${pageNumber} has no annotations`);
        }

        setIsRendering(false);
        console.log(`✅ Page ${pageNumber} fully rendered!`);
        
        if (onPageRendered) {
          onPageRendered(pageNumber);
        }

      } catch (error) {
        if (!isCancelled) {
          // Ignore RenderingCancelledException - it's expected when component unmounts
          if (error.name === 'RenderingCancelledException') {
            console.log(`⚠️ Page ${pageNumber} rendering was cancelled (normal)`);
            return;
          }
          
          console.error(`❌ Error rendering PDF page ${pageNumber}:`, error);
          setRenderError(error.message);
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      // Cancel ongoing render operation
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber, onPageRendered]);

  return (
    <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Rendering page {pageNumber}...</p>
          </div>
        </div>
      )}
      
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-center p-4">
            <p className="text-red-600 font-semibold">Error rendering page</p>
            <p className="text-red-500 text-sm mt-2">{renderError}</p>
          </div>
        </div>
      )}

      {/* Canvas for rendering PDF content */}
      <canvas 
        ref={canvasRef} 
        className="block w-full h-auto"
        style={{ zIndex: 1 }}
      />
      
      {/* Text layer for text selection */}
      <div 
        ref={textLayerRef}
        className="absolute top-0 left-0 w-full h-full textLayer"
        style={{ zIndex: 2, pointerEvents: 'none' }}
      />
      
      {/* Annotation layer for hyperlinks and interactive elements */}
      <div 
        ref={annotationLayerRef}
        className="absolute top-0 left-0 w-full h-full annotationLayer"
        style={{ zIndex: 3 }}
      />
    </div>
  );
};

export default PDFPageRenderer;
