import { ref, computed, nextTick, onBeforeUnmount, readonly } from 'vue';

// Drag interaction constants
const DRAG_CONSTANTS = {
  // Distance thresholds (pixels)
  SNAP_THRESHOLD: 50,           // Distance to snap to center
  DRAG_THRESHOLD: 5,            // Movement to start drag
  MIN_SAFE_MARGIN: 20,          // Minimum margin from viewport edge
  MIN_MAX_OFFSET: 100,          // Minimum maximum offset
  DEFAULT_MAX_OFFSET: 200,      // Fallback maximum offset
  
  // Timing thresholds (milliseconds)
  DOUBLE_CLICK_DELAY: 400,      // Max time between clicks for double-click
  CLICK_TIMEOUT: 300,           // Max time for click vs drag detection
  
  // Keyboard interaction
  KEYBOARD_STEP: 20,            // Pixels to move with arrow keys
  
  // Animation timing
  TRANSITION_DURATION: '0.2s',  // CSS transition duration
  TRANSITION_EASING: 'ease-out' // CSS transition easing
};

/**
 * Composable for handling drag functionality with click/double-click detection
 * Provides reusable drag logic with constraints, snap-to-center, and memory leak prevention
 * 
 * @param {Object} options - Configuration options
 * @param {Ref} options.target - Reactive target object with offset property
 * @param {Function} options.onToggle - Callback for single click (pin toggle)
 * @param {Function} options.onDoubleClick - Callback for double click (center)
 * @param {Function} options.calculateMaxOffset - Function to calculate drag constraints
 * @param {Number} options.snapThreshold - Distance threshold for snap-to-center
 * @param {Number} options.dragThreshold - Movement threshold to start drag
 * @param {Number} options.doubleClickDelay - Max time between clicks for double-click
 * @param {Number} options.clickTimeout - Max time for click vs drag detection
 * @returns {Object} Drag handle functionality
 */
export { DRAG_CONSTANTS };

export function useDragHandle(options) {
  const {
    target,
    onToggle,
    onDoubleClick,
    calculateMaxOffset,
    snapThreshold = DRAG_CONSTANTS.SNAP_THRESHOLD,
    dragThreshold = DRAG_CONSTANTS.DRAG_THRESHOLD,
    doubleClickDelay = DRAG_CONSTANTS.DOUBLE_CLICK_DELAY,
    clickTimeout = DRAG_CONSTANTS.CLICK_TIMEOUT
  } = options;

  // Drag state
  const isDragging = ref(false);
  const dragState = ref({
    startX: 0,
    startOffset: 0,
    maxOffset: 0
  });

  // Click detection state
  const lastClickTime = ref(0);
  const clickCount = ref(0);
  let clickTimeoutId = null;

  // Track active event listeners for cleanup
  const activeListeners = ref({
    mousemove: null,
    mouseup: null,
    mouseleave: null
  });

  // Computed styles
  const dragStyle = computed(() => ({
    transition: isDragging.value ? 'none' : `transform ${DRAG_CONSTANTS.TRANSITION_DURATION} ${DRAG_CONSTANTS.TRANSITION_EASING}`
  }));

  const handleStyle = computed(() => ({
    cursor: isDragging.value ? 'grabbing' : 'grab',
    userSelect: 'none',
    transition: `transform ${DRAG_CONSTANTS.TRANSITION_DURATION} ease`
  }));

  // Utility functions
  const constrainOffset = (offset) => {
    const maxOffset = dragState.value.maxOffset;
    return Math.max(-maxOffset, Math.min(maxOffset, offset));
  };

  const updateMaxOffset = async () => {
    if (calculateMaxOffset) {
      await nextTick();
      dragState.value.maxOffset = calculateMaxOffset();
    }
  };

  // Cleanup function for event listeners
  const cleanupListeners = () => {
    Object.entries(activeListeners.value).forEach(([event, handler]) => {
      if (handler) {
        document.removeEventListener(event, handler);
        activeListeners.value[event] = null;
      }
    });

    if (isDragging.value) {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      isDragging.value = false;
    }
  };

  // Mouse event handlers
  const handleMouseDown = (event) => {
    if (event.button !== 0) return; // Only left mouse button
    
    event.preventDefault();
    event.stopPropagation();
    
    const startTime = Date.now();
    const startX = event.clientX;
    const startY = event.clientY;
    let hasDragged = false;
    
    const cleanup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      activeListeners.value.mousemove = null;
      activeListeners.value.mouseup = null;
    };

    const onMouseMove = (e) => {
      const deltaX = Math.abs(e.clientX - startX);
      const deltaY = Math.abs(e.clientY - startY);
      
      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        hasDragged = true;
        cleanup();
        startDrag(event);
      }
    };
    
    const onMouseUp = () => {
      cleanup();
      
      // If it was a quick click without drag
      if (!hasDragged && Date.now() - startTime < clickTimeout) {
        const timeSinceLastClick = startTime - lastClickTime.value;
        
        // Double-click detection
        if (timeSinceLastClick < doubleClickDelay && clickCount.value === 1) {
          clearTimeout(clickTimeoutId);
          clickCount.value = 0;
          if (onDoubleClick) onDoubleClick();
        } else {
          clickCount.value = 1;
          clickTimeoutId = setTimeout(() => {
            if (clickCount.value === 1 && onToggle) onToggle();
            clickCount.value = 0;
          }, doubleClickDelay);
        }
        
        lastClickTime.value = startTime;
      }
    };
    
    // Track listeners for cleanup
    activeListeners.value.mousemove = onMouseMove;
    activeListeners.value.mouseup = onMouseUp;
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startDrag = (event) => {
    if (event.button !== 0) return; // Only left mouse button
    
    // Don't start dragging if target is pinned
    if (target.value.pinned) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    isDragging.value = true;
    dragState.value.startX = event.clientX;
    dragState.value.startOffset = target.value.offset;
    dragState.value.maxOffset = calculateMaxOffset ? calculateMaxOffset() : 200;

    // Track listeners for cleanup
    const moveHandler = (e) => handleDragMove(e);
    activeListeners.value.mousemove = moveHandler;
    activeListeners.value.mouseup = handleDragEnd;
    activeListeners.value.mouseleave = handleDragEnd;

    document.addEventListener('mousemove', moveHandler, { passive: false });
    document.addEventListener('mouseup', handleDragEnd, { once: true });
    document.addEventListener('mouseleave', handleDragEnd, { once: true });
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  const handleDragMove = (event) => {
    if (!isDragging.value) return;
    
    event.preventDefault();
    const deltaX = event.clientX - dragState.value.startX;
    const newOffset = dragState.value.startOffset + deltaX;
    target.value.offset = constrainOffset(newOffset);
  };

  const handleDragEnd = () => {
    isDragging.value = false;
    
    // Restore text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    // Snap to center if close enough
    if (Math.abs(target.value.offset) < snapThreshold) {
      target.value.offset = 0;
    }
    
    // Clean up tracked listeners
    cleanupListeners();
  };

  // Keyboard accessibility
  const handleKeyDown = (event) => {
    const step = DRAG_CONSTANTS.KEYBOARD_STEP;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        target.value.offset = constrainOffset(target.value.offset - step);
        break;
      case 'ArrowRight':
        event.preventDefault();
        target.value.offset = constrainOffset(target.value.offset + step);
        break;
      case 'Home':
      case 'Escape':
        event.preventDefault();
        target.value.offset = 0;
        break;
    }
  };

  // Window resize handler
  const handleResize = () => {
    updateMaxOffset();
    target.value.offset = constrainOffset(target.value.offset);
  };

  // Initialize constraints
  const initialize = async () => {
    await updateMaxOffset();
  };

  // Cleanup on unmount
  onBeforeUnmount(() => {
    cleanupListeners();
    clearTimeout(clickTimeoutId);
    clickCount.value = 0;
    window.removeEventListener('resize', handleResize);
  });

  return {
    // State
    isDragging: readonly(isDragging),
    dragStyle,
    handleStyle,
    
    // Event handlers
    handleMouseDown,
    handleKeyDown,
    handleResize,
    
    // Utility functions
    initialize,
    updateMaxOffset,
    constrainOffset,
    cleanupListeners,
    
    // For manual control if needed
    dragState: readonly(dragState)
  };
}