import React, { useRef, useEffect, useState } from 'react';
import UnlockVideoModal from './UnlockVideoModal';
import { publicAPI } from '../services/api';
import toast from 'react-hot-toast';

const PREVIEW_TIME = 15; // 15 seconds preview

/**
 * PreviewVideo - Video with 15-second preview and unlock feature
 * Plays first 15 seconds, then shows unlock modal for mobile number capture
 */
const PreviewVideo = ({ 
  src, 
  flipbookId, 
  sessionId,
  className = '', 
  onError, 
  onLoad 
}) => {
  const videoRef = useRef(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Check if video is already unlocked (from sessionStorage)
  useEffect(() => {
    const storageKey = `unlocked_${flipbookId}`;
    const isUnlocked = sessionStorage.getItem(storageKey);
    if (isUnlocked === 'true') {
      setUnlocked(true);
    }
  }, [flipbookId]);

  // Video time update handler
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || unlocked || !hasStarted) return;

    // Pause at preview time limit
    if (video.currentTime >= PREVIEW_TIME) {
      video.pause();
      setShowUnlockModal(true);
    }
  };

  // Handle unlock submission
  const handleUnlock = async (mobile) => {
    try {
      const response = await publicAPI.unlockVideo(flipbookId, mobile, sessionId);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      // Mark as unlocked
      setUnlocked(true);
      const storageKey = `unlocked_${flipbookId}`;
      sessionStorage.setItem(storageKey, 'true');
      
      setShowUnlockModal(false);
      
      // Resume video playback
      if (videoRef.current) {
        videoRef.current.play();
      }
      
      toast.success(mobile ? 'Video unlocked! Thanks for sharing your contact.' : 'Video unlocked!');
    } catch (error) {
      console.error('Error unlocking video:', error);
      toast.error('Failed to unlock video. Please try again.');
    }
  };

  // Auto-play video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        await video.play();
        setHasStarted(true);
        if (onLoad) onLoad();
      } catch (error) {
        console.error('Error auto-playing video:', error);
        if (onError) onError(error);
      }
    };

    playVideo();

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && video.paused && (unlocked || video.currentTime < PREVIEW_TIME)) {
        playVideo();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [src, onError, onLoad, unlocked]);

  return (
    <>
      <div className={`relative w-full h-full ${className}`}>
        <video
          ref={videoRef}
          src={src}
          autoPlay
          loop={unlocked} // Only loop if unlocked
          muted={true} // Must be muted for autoplay to work
          playsInline
          controls={true}
          className="w-full h-full object-contain bg-black"
          onTimeUpdate={handleTimeUpdate}
          onError={(e) => {
            console.error('Video error:', e);
            if (onError) onError(e);
          }}
          style={{
            WebkitPlaysinline: true
          }}
        />
        
        {/* Preview indicator overlay */}
        {!unlocked && hasStarted && !showUnlockModal && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-sm">
            🎬 Preview Mode ({Math.max(0, PREVIEW_TIME - Math.floor(videoRef.current?.currentTime || 0))}s)
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <UnlockVideoModal
          onUnlock={handleUnlock}
          onClose={() => {
            setShowUnlockModal(false);
            // Allow reopening modal if user wants to unlock later
          }}
        />
      )}
    </>
  );
};

export default PreviewVideo;
