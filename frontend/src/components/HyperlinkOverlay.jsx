import React from 'react';

/**
 * HyperlinkOverlay Component
 * Renders clickable overlay elements on top of PDF page images to restore hyperlink functionality
 * 
 * @param {Object} props
 * @param {Array} props.hyperlinks - Array of hyperlink objects with coordinates
 * @param {number} props.imageWidth - Width of the displayed image
 * @param {number} props.imageHeight - Height of the displayed image
 * @param {boolean} props.showDebug - Show visual debug overlays (default: false)
 */
const HyperlinkOverlay = ({ hyperlinks = [], imageWidth, imageHeight, showDebug = false }) => {
  if (!hyperlinks || hyperlinks.length === 0) {
    return null;
  }

  const handleLinkClick = (hyperlink) => {
    console.log('Hyperlink clicked:', hyperlink);
    
    if (hyperlink.type === 'email') {
      window.location.href = `mailto:${hyperlink.url}`;
    } else if (hyperlink.type === 'internal') {
      // Handle internal document navigation
      console.log('Internal link - implement page navigation:', hyperlink.url);
    } else {
      // External URL
      window.open(hyperlink.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width: imageWidth, height: imageHeight }}
    >
      {hyperlinks.map((link, index) => (
        <div
          key={index}
          onClick={() => handleLinkClick(link)}
          className={`absolute pointer-events-auto cursor-pointer transition-all ${
            showDebug 
              ? 'bg-blue-500 bg-opacity-30 border-2 border-blue-600 hover:bg-opacity-50' 
              : 'hover:bg-blue-100 hover:bg-opacity-20'
          }`}
          style={{
            left: `${link.x}px`,
            top: `${link.y}px`,
            width: `${link.width}px`,
            height: `${link.height}px`,
          }}
          title={link.url}
          role="link"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleLinkClick(link);
            }
          }}
        >
          {showDebug && (
            <span className="text-xs text-white bg-blue-600 px-1 rounded">
              {link.text || 'Link'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default HyperlinkOverlay;
