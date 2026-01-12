import React, { useRef, useEffect } from 'react';

/**
 * LoopingVideo - Auto-playing, looping video without controls
 * As per client requirements: no start/stop, auto loop, no visible controls
 */
const LoopingVideo = ({ src, className = '', onError, onLoad }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video starts playing
    const playVideo = async () => {
      try {
        await video.play();
        if (onLoad) onLoad();
      } catch (error) {
        console.error('Error auto-playing video:', error);
        if (onError) onError(error);
      }
    };

    // Play when component mounts
    playVideo();

    // Handle visibility change - resume playing when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && video.paused) {
        playVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [src, onError, onLoad]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        className="w-full h-full object-contain"
        onError={(e) => {
          console.error('Video error:', e);
          if (onError) onError(e);
        }}
        style={{
          pointerEvents: 'none', // Prevent user interaction
          WebkitPlaysinline: true // iOS compatibility
        }}
      />
      
      {/* Optional overlay to prevent any interaction */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export default LoopingVideo;
