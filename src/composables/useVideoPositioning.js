import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useDevice } from '@/composables/useDevice';

/**
 * Composable for managing video element positioning and overlay bounds tracking
 * Handles different video sources (WebRTC, MJPEG) and fallback to containers
 */
export function useVideoPositioning() {
  const { device } = useDevice();

  // Safety constants to prevent toolbar coverage
  const TOOLBAR_HEIGHT = 60; // Approximate toolbar height
  const TOOLBAR_SAFE_ZONE = 80; // Extra margin to ensure no toolbar overlap

  // Video element bounds tracking
  const videoBounds = ref({ top: 0, left: 0, width: 0, height: 0 });
  const isVideoVisible = ref(false);

  // Observer and cleanup references
  const resizeObserver = ref(null);
  const windowCleanup = ref(null);

  // Cache for performance optimization
  let lastBounds = { top: 0, left: 0, width: 0, height: 0 };
  let lastElementType = null; // Track if we switched between video/container
  let lastLoggedElementType = null; // Prevent repetitive console logs
  let lastLoggedDimensions = null; // Prevent repetitive dimension logs

  // Validate bounds to prevent toolbar coverage and ensure safe positioning
  const validateBounds = (bounds, elementType) => {
    const isContainer = elementType !== 'VIDEO';

    // For container elements during no-signal, apply safety restrictions
    if (isContainer) {
      console.log('DEBUG: Validating container bounds for overlay safety');
      console.log('DEBUG: HDMI Active:', device.value.video.isHDMIActivate);
      console.log('DEBUG: Connection State:', device.value.video.connectionState);

      // CRITICAL FIX: If HDMI is manually deactivated, use minimal safe area
      if (!device.value.video.isHDMIActivate) {
        console.warn('CRITICAL: HDMI manually deactivated - using minimal overlay area to prevent toolbar blocking');

        const minimalBounds = {
          top: window.innerHeight - 200, // Position near bottom
          left: 50,
          width: Math.min(800, window.innerWidth - 100), // Reasonable width
          height: 150 // Minimal height
        };

        console.log('DEBUG: Minimal bounds applied:', minimalBounds);
        return minimalBounds;
      }

      // Check if bounds would cover toolbar area - if so, apply safety measures
      const wouldCoverToolbar = bounds.top < TOOLBAR_SAFE_ZONE;
      if (wouldCoverToolbar) {
        console.warn('WARNING: Container bounds would cover toolbar area, applying safety corrections');
      }

      // Ensure overlay doesn't cover toolbar area (top safe zone)
      const safeTop = Math.max(bounds.top, TOOLBAR_SAFE_ZONE);

      // Ensure reasonable bounds that don't extend beyond safe video area
      const maxWidth = Math.min(bounds.width, window.innerWidth - 40); // 20px margins
      const maxHeight = Math.min(bounds.height, window.innerHeight - TOOLBAR_SAFE_ZONE - 40);

      const safeBounds = {
        top: safeTop,
        left: Math.max(bounds.left, 20), // Minimum left margin
        width: maxWidth,
        height: maxHeight
      };

      console.log('DEBUG: Original bounds:', bounds);
      console.log('DEBUG: Safe bounds:', safeBounds);

      return safeBounds;
    }

    // For real video elements, use original bounds
    return bounds;
  };

  // Get the actual video element (WebRTC or MJPEG) or video container when no video
  const getVideoElement = () => {
    // First try to find actual video elements
    const videoElement = document.getElementById('webrtc-output') || document.getElementById('mjpeg-output');
    if (videoElement) {
      // Validate video element has reasonable dimensions before using it
      // This prevents overlay compression during HDMI activation transition
      const rect = videoElement.getBoundingClientRect();
      const currentDimensions = `${rect.width} x ${rect.height}`;
      if (lastLoggedDimensions !== currentDimensions) {
        console.log('Video element dimensions:', currentDimensions);
        lastLoggedDimensions = currentDimensions;
      }

      // Use stricter validation - video must be reasonably sized
      if (rect.width >= 400 && rect.height >= 200) {
        if (lastLoggedElementType !== 'video') {
          console.log('Using video element for overlay tracking');
          lastLoggedElementType = 'video';
        }
        return videoElement;
      }
      // Video element exists but dimensions too small - fall back to container
      // Log only once when switching to container mode
      if (lastLoggedElementType !== 'container') {
        console.log('Video element too small, using container instead');
        lastLoggedElementType = 'container';
      }
    }

    // No video element found or video not ready - use safer container fallback
    // This allows overlay to track container but with safety restrictions
    console.log('DEBUG: No video element found, using container fallback');

    // Try to find the most specific video container first
    let container = document.querySelector('.video-center-wrapper');
    if (!container) {
      container = document.getElementById('appkvm');
    }

    // Final fallback to main container but with warnings
    if (!container) {
      console.warn('WARNING: No suitable container found for overlay positioning');
      container = document.querySelector('.main-layout') || document.body;
    }

    return container;
  };

  // Update overlay position with optimization
  const updateOverlayPosition = () => {
    const element = getVideoElement();
    if (!element) {
      isVideoVisible.value = false;
      return;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      isVideoVisible.value = false;
      return;
    }

    const currentElementType = element.tagName;

    // Early return if bounds haven't changed (performance optimization)
    if (rect.top === lastBounds.top && rect.left === lastBounds.left &&
        rect.width === lastBounds.width && rect.height === lastBounds.height &&
        currentElementType === lastElementType) {
      return;
    }

    // Create initial bounds object
    const rawBounds = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };

    // Validate bounds to prevent toolbar coverage and ensure safety
    const safeBounds = validateBounds(rawBounds, currentElementType);

    // Apply safe bounds
    videoBounds.value = safeBounds;

    // Track whether we found a real video element
    isVideoVisible.value = element.tagName === 'VIDEO';
    lastBounds = safeBounds;
    lastElementType = currentElementType;
  };

  // Setup ResizeObserver for efficient DOM tracking
  const setupResizeObserver = () => {
    if (!window.ResizeObserver) {
      console.warn('ResizeObserver not supported, falling back to window resize events');
      return null;
    }

    const observer = new ResizeObserver(entries => {
      // Always update for ResizeObserver - layout changes matter
      nextTick(updateOverlayPosition);
    });

    // Observe video elements when they exist
    const observeVideoElements = () => {
      const videoElement = document.getElementById('webrtc-output') ||
                          document.getElementById('mjpeg-output');
      if (videoElement) {
        observer.observe(videoElement);
      }

      // Also observe the video container for layout changes
      const container = document.getElementById('appkvm') ||
                       document.querySelector('.video-center-wrapper');
      if (container) {
        observer.observe(container);
      }
    };

    // Initial observation setup
    nextTick(observeVideoElements);

    // Re-observe when video elements change (e.g., mode switch)
    watch(() => device.value.video.videoMode, () => {
      observer.disconnect();
      nextTick(observeVideoElements);
    });

    return observer;
  };

  // Setup window event listeners
  const setupWindowListeners = () => {
    const debouncedUpdate = () => {
      // Always update - toolbar functionality is critical
      nextTick(updateOverlayPosition);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
    };
  };

  // Initialize positioning system
  const initialize = () => {
    // Initial position update
    nextTick(updateOverlayPosition);

    // Setup ResizeObserver for DOM changes
    resizeObserver.value = setupResizeObserver();

    // Setup window event listeners
    windowCleanup.value = setupWindowListeners();
  };

  // Cleanup positioning system
  const cleanup = () => {
    // Clean up ResizeObserver
    if (resizeObserver.value) {
      resizeObserver.value.disconnect();
      resizeObserver.value = null;
    }

    // Clean up window event listeners
    if (windowCleanup.value) {
      windowCleanup.value();
      windowCleanup.value = null;
    }
  };

  // Auto-initialize and cleanup
  onMounted(initialize);
  onBeforeUnmount(cleanup);

  return {
    // State (readonly)
    videoBounds: computed(() => videoBounds.value),
    isVideoVisible: computed(() => isVideoVisible.value),
    
    // Methods
    updateOverlayPosition,
    initialize,
    cleanup
  };
}