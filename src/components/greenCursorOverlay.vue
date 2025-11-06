<template>
  <!-- Green dot cursor overlay -->
  <div
    v-if="showLocalCursor && isVisible"
    class="cursor-overlay"
    :style="{
      left: cursorPosition.x + 'px',
      top: cursorPosition.y + 'px',
      zIndex: zIndex.toolbar + 1,
    }"
  >
    <div class="green-dot"></div>
  </div>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { zIndex } from '@/styles/zIndex';

  const store = useAppStore();
  const { misc } = storeToRefs(store);

  // Component state
  const cursorPosition = ref({ x: 0, y: 0 });
  const isVisible = ref(false);
  const videoContainer = ref(null);

  // Check if green cursor should be shown
  const showLocalCursor = computed(() => {
    return misc.value.isLocalCursorVisible && misc.value.currentCursor === 'cursor-green-dot';
  });

  // Update cursor visibility when settings change or mouse enters/leaves
  const updateCursorVisibility = () => {
    if (!videoContainer.value) return;

    // Hide local cursor if green dot is active and mouse is over video
    if (showLocalCursor.value && isVisible.value) {
      videoContainer.value.style.cursor = 'none';
      videoContainer.value.setAttribute('data-green-cursor', 'true');
      // Also hide cursor on all child elements
      const allElements = videoContainer.value.querySelectorAll('*');
      allElements.forEach((el) => {
        el.style.cursor = 'none';
      });
    } else {
      videoContainer.value.style.cursor = '';
      videoContainer.value.removeAttribute('data-green-cursor');
      const allElements = videoContainer.value.querySelectorAll('*');
      allElements.forEach((el) => {
        el.style.cursor = '';
      });
    }
  };

  // Watch for cursor setting changes
  watch([showLocalCursor, isVisible], updateCursorVisibility);

  // Mouse event handlers
  const handleMouseMove = (event) => {
    if (!videoContainer.value) return;

    const rect = videoContainer.value.getBoundingClientRect();
    cursorPosition.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleMouseEnter = () => {
    isVisible.value = true;
    // Immediately hide cursor when entering if green dot is active
    if (showLocalCursor.value) {
      updateCursorVisibility();
    }
  };

  const handleMouseLeave = () => {
    isVisible.value = false;
  };

  // Lifecycle hooks
  onMounted(() => {
    videoContainer.value = document.querySelector('.video-container');

    if (videoContainer.value) {
      videoContainer.value.addEventListener('mousemove', handleMouseMove, { passive: true });
      videoContainer.value.addEventListener('mouseenter', handleMouseEnter);
      videoContainer.value.addEventListener('mouseleave', handleMouseLeave);
    }
  });

  onUnmounted(() => {
    if (videoContainer.value) {
      videoContainer.value.removeEventListener('mousemove', handleMouseMove);
      videoContainer.value.removeEventListener('mouseenter', handleMouseEnter);
      videoContainer.value.removeEventListener('mouseleave', handleMouseLeave);
      videoContainer.value.style.cursor = '';
    }
  });
</script>

<style scoped>
  .cursor-overlay {
    position: absolute;
    pointer-events: none;
    transform: translate(-8px, -8px); /* Center the 16px dot */
    transition: opacity 0.1s ease;
  }

  /* Global cursor hiding when green dot is active */
  :global(.video-container[data-green-cursor='true']),
  :global(.video-container[data-green-cursor='true'] *) {
    cursor: none !important;
  }

  .green-dot {
    width: 12px;
    height: 12px;
    background: radial-gradient(circle, #76ff03 0%, #4caf50 70%, #2e7d32 100%);
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow:
      0 0 4px rgba(118, 255, 3, 0.6),
      0 0 8px rgba(118, 255, 3, 0.3);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow:
        0 0 4px rgba(118, 255, 3, 0.6),
        0 0 8px rgba(118, 255, 3, 0.3);
    }
    50% {
      box-shadow:
        0 0 8px rgba(118, 255, 3, 0.8),
        0 0 16px rgba(118, 255, 3, 0.4);
    }
  }
</style>
