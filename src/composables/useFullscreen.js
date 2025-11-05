import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * Composable for handling fullscreen functionality with cross-browser support
 * @param {Object} options - Configuration options
 * @param {Function} options.onEnter - Callback when entering fullscreen
 * @param {Function} options.onExit - Callback when exiting fullscreen
 * @returns {Object} Fullscreen functionality
 */
export function useFullscreen(options = {}) {
  const { onEnter, onExit } = options;
  
  const isFullscreen = ref(false);

  // Cross-browser fullscreen detection
  const updateFullscreenStatus = () => {
    const wasFullscreen = isFullscreen.value;
    isFullscreen.value = !!(
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );

    // Trigger callbacks on state change
    if (wasFullscreen !== isFullscreen.value) {
      if (isFullscreen.value && onEnter) {
        onEnter();
      } else if (!isFullscreen.value && onExit) {
        onExit();
      }
    }
  };

  // Enter fullscreen with cross-browser support
  const enterFullscreen = () => {
    const root = document.documentElement;
    const requestFullscreen =
      root.requestFullscreen ||
      root.mozRequestFullScreen ||
      root.webkitRequestFullScreen ||
      root.msRequestFullscreen;

    if (requestFullscreen && !isFullscreen.value) {
      requestFullscreen.call(root);
    }
  };

  // Exit fullscreen (browser handles this automatically on ESC)
  const exitFullscreen = () => {
    const exitMethod =
      document.exitFullscreen ||
      document.mozCancelFullScreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;

    if (exitMethod && isFullscreen.value) {
      exitMethod.call(document);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (isFullscreen.value) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  onMounted(() => {
    // Add cross-browser fullscreen change listeners
    document.addEventListener('fullscreenchange', updateFullscreenStatus);
    document.addEventListener('webkitfullscreenchange', updateFullscreenStatus);
    document.addEventListener('mozfullscreenchange', updateFullscreenStatus);
    document.addEventListener('MSFullscreenChange', updateFullscreenStatus);
    
    // Initial status check
    updateFullscreenStatus();
  });

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', updateFullscreenStatus);
    document.removeEventListener('webkitfullscreenchange', updateFullscreenStatus);
    document.removeEventListener('mozfullscreenchange', updateFullscreenStatus);
    document.removeEventListener('MSFullscreenChange', updateFullscreenStatus);
  });

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
}