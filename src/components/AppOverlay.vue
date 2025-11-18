<template>
  <v-overlay
    :model-value="showOverlay"
    :opacity="0"
    content-class="overlay-passthrough"
    :style="overlayStyle"
    :scrim="false"
    :persistent="true"
    no-click-animation
  >
    <!-- top control bar-->
    <div
      class="overlay-control-bar d-flex ga-3 pa-1 justify-end align-center"
      :style="`position: absolute; top: ${topControlsPosition}; right: 20px;`"
    >
      <!-- Experimental Controls Group -->
      <div
        v-if="isExperimental"
        class="control-group"
        data-experimental="true"
      >
        <KvmHandRaise />
        <KvmClipboard />
      </div>

      <!-- Recording Controls Group -->
      <div
        v-if="isVideoVisible"
        class="control-group"
      >
        <v-tooltip
          location="top"
          content-class=""
        >
          <template #activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              :size="size"
              icon="mdi-camera-outline"
              @click="takeSnapshot"
            />
          </template>
          <span>Take snapshot</span>
        </v-tooltip>

        <v-tooltip
          v-if="device.video.videoMode === 'h264'"
          location="top"
          content-class=""
        >
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-ripple
              v-bind="tooltipProps"
              class="text-none"
              :color="isRecording ? '#D32F2F' : '#76FF03'"
              :prepend-icon="isRecording ? 'mdi-stop' : 'mdi-radiobox-marked'"
              :text="isRecording ? formattedRecordingTime : undefined"
              :variant="isRecording ? 'tonal' : 'plain'"
              size="small"
              @click="handleVideoRecord"
            />
          </template>
          <span>{{ isRecording ? t('common.stopRecording') : t('common.startRecording') }}</span>
        </v-tooltip>
      </div>
    </div>

    <div
      class="overlay-control-bar d-flex ga-3 pa-1 justify-start align-center"
      :style="`position: absolute; bottom: ${bottomControlsPosition}; left: 20px;`"
    >
      <!-- bottom control bar-->
      <div class="d-flex w-100 ga-3 pa-0 align-center">
        <!-- Audio Controls Group -->
        <div
          v-if="device.video.videoMode === 'h264' && isVideoVisible"
          class="control-group"
        >
          <div
            class="d-inline-flex align-center ga-2"
            @mouseenter="isHoveringVolume = true"
            @mouseleave="isHoveringVolume = false"
          >
            <v-tooltip
              location="top"
              content-class=""
            >
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-ripple
                  v-bind="tooltipProps"
                  :color="isHoveringVolume || device.video.audioVolume > 0 ? '#76FF03' : '#FFFFFF'"
                  :variant="device.video.audioVolume > 0 ? 'tonal' : 'plain'"
                  :prepend-icon="
                    device.video.audioVolume === 0 || undefined
                      ? 'mdi-volume-mute'
                      : device.video.audioVolume < 30
                        ? 'mdi-volume-low'
                        : device.video.audioVolume < 70
                          ? 'mdi-volume-medium'
                          : 'mdi-volume-high'
                  "
                  :size="size"
                  @click="device.video.audioVolume = 0"
                />
              </template>
              <span>Mute</span>
            </v-tooltip>

            <!-- Only show slider on hover -->
            <v-slider
              v-if="isHoveringVolume"
              v-model="device.video.audioVolume"
              direction="horizontal"
              hide-details
              color="#76FF03"
              track-color="white"
              track-size="10"
              style="width: 150px"
            />
          </div>

          <v-tooltip
            location="top"
            content-class=""
          >
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-ripple
                v-bind="tooltipProps"
                :color="!canUseMic ? '#9E9E9E' : audio.isMicrophoneOn ? '#76FF03' : '#FFFFFF'"
                :variant="audio.isMicrophoneOn ? 'tonal' : 'plain'"
                :class="{ 'cursor-not-allowed': !canUseMic }"
                :prepend-icon="audio.isMicrophoneOn ? 'mdi-microphone' : 'mdi-microphone-off'"
                :size="size"
                @click="onMicClick"
              />
            </template>
            <span>{{
              canUseMic ? (audio.isMicrophoneOn ? t('common.micMute') : t('common.micUnmute')) : t('common.micRegisterFirst')
            }}</span>
          </v-tooltip>
        </div>

        <v-spacer />
      </div>
    </div>

    <!-- Right-aligned controls -->
    <div
      class="overlay-control-bar d-flex ga-3 pa-1 justify-end align-center"
      :style="`position: absolute; bottom: ${bottomControlsPosition}; right: 8px;`"
    >
      <!-- Combined Switch and ATX Controls Group -->
      <div
        v-if="filteredChannels.length > 0 || devicePersist.isATXActive"
        class="control-group switch-controls"
      >
        <!-- Switch Controls -->
        <template v-if="filteredChannels.length > 0">
          <v-tooltip
            location="top"
            content-class=""
          >
            <template #activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                icon="mdi-monitor-multiple"
                :size="size"
              />
            </template>
            <span>{{ t('settings.switch.port') }}</span>
          </v-tooltip>
          <v-btn-toggle
            :model-value="activeChannel"
            color="#76FF03"
            density="compact"
            @update:model-value="changeSwitchChannel"
          >
            <template
              v-for="channel in filteredChannels"
              :key="channel.id"
            >
              <v-tooltip
                location="top"
                content-class=""
              >
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :value="channel.name"
                    size="small"
                    variant="outlined"
                    class="text-none"
                  >
                    {{ channel.name }}
                  </v-btn>
                </template>
                <span>{{ displayName(channel) }}</span>
              </v-tooltip>
            </template>
          </v-btn-toggle>
        </template>
        
        <!-- ATX Controls -->
        <v-tooltip
          v-if="devicePersist.isATXActive"
          location="top"
          content-class=""
        >
          <template #activator="{ props: tooltipProps }">
            <v-menu
              location="top"
              :style="{ zIndex: zIndex.overlay }"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="{ ...props, ...tooltipProps }"
                  size="default"
                  rounded
                  variant="plain"
                >
                  mdi-power-settings
                </v-icon>
              </template>

              <v-list select-strategy="leaf">
                <v-list-item
                  v-for="(atxItem, atxIndex) in atxItems"
                  :key="atxIndex"
                  :value="atxIndex"
                  active-class="text-green"
                  @click="triggerPowerButton(atxItem.action)"
                >
                  <v-icon
                    :icon="atxItem.icon"
                    color="#76FF03"
                  />
                  {{ atxItem.title }}
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <span>{{ t('common.atxPower') }}</span>
        </v-tooltip>
      </div>

      <v-divider
        class="mx-3"
        inset
        vertical
      />

      <!-- Experimental Controls Group -->
      <div
        v-if="isExperimental"
        class="control-group"
        data-experimental="true"
      >
        <v-tooltip
          location="top"
          content-class=""
        >
          <template #activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              :color="isCameraOn ? '#76FF03' : undefined"
              :size="size"
              :icon="isCameraOn ? 'mdi-video' : 'mdi-video-off-outline'"
              @click="toggleCamera(streamElementRef)"
            />
          </template>
          <span>{{ isCameraOn ? 'Turn off' : 'Turn on' }}</span>
        </v-tooltip>

        <v-tooltip
          location="top"
          content-class=""
        >
          <template #activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              :color="isShowingPiP ? '#76FF03' : undefined"
              :size="size"
              :icon="
                isShowingPiP
                  ? 'mdi-picture-in-picture-bottom-right'
                  : 'mdi-picture-in-picture-bottom-right-outline'
              "
              @click="togglePiP"
            />
          </template>
          <span>{{ isShowingPiP ? 'Turn off PIP' : 'Turn on PIP' }}</span>
        </v-tooltip>

        <v-tooltip location="top">
          <template #activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              :color="isCasting ? '#76FF03' : undefined"
              :size="size"
              :icon="isCasting ? 'mdi-cast-connected' : 'mdi-cast'"
              @click="toggleCast"
            />
          </template>
          <span>{{ isCasting ? 'Stop Casting' : 'Start Casting' }}</span>
        </v-tooltip>

        <v-divider
          class="mx-3"
          inset
          vertical
        />
      </div>
    </div>
  </v-overlay>
</template>

<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useMicrophone } from '@/composables/useMicrophone';
  import { useCamera } from '@/composables/useCameraWithSwitch';
  import { zIndex } from '@/styles/zIndex';
  import { useHdmiSwitch } from '@/composables/useHdmiSwitch';
  import { useI18n } from 'vue-i18n';
  import { useRecording } from '@/composables/useRecording';
  import { useATX } from '@/composables/useATX';

  const store = useAppStore();
  const { device } = useDevice();
  const { t } = useI18n();
  const { changeSwitchChannel } = useHdmiSwitch();
  // Computed property to access hdmiSwitch items
  const canUseMic = computed(() => device.value?.mic?.isRegistered === true);

  const onMicClick = () => {
    if (!canUseMic.value) return;
    toggleMicrophone();
  };

  const {
    showOverlay,
    isShowingPiP,
    isCasting,
    pipVideoElement,
    isExperimental,
    isCameraOn,
    audio,
    isRecording,
    settings,
    devicePersist,
  } = storeToRefs(store);

  const isHoveringVolume = ref(false);
  const size = 25;
  // Constants for positioning (based on perfect Case 1b standard)
  const DEFAULT_TOP_MARGIN = 20; // Top margin (from Case 1b)
  const DEFAULT_BOTTOM_MARGIN = 20; // Bottom margin (match top for symmetry)
  
  // Safety constants to prevent toolbar coverage
  const TOOLBAR_SAFE_ZONE = 80; // Extra margin to ensure no toolbar overlap

  // Video element bounds tracking for overlay positioning
  const videoBounds = ref({ top: 0, left: 0, width: 0, height: 0 });
  const isVideoVisible = ref(false);
  
  // Observer and cleanup references
  const resizeObserver = ref(null);
  const intersectionObserver = ref(null);
  const windowCleanup = ref(null);
  
  // Track if overlay is visible in viewport for performance optimization
  const isOverlayIntersecting = ref(true); // Default to true for immediate functionality
  // Cache for performance optimization
  let lastBounds = { top: 0, left: 0, width: 0, height: 0 };
  let lastElementType = null; // Track if we switched between video/container
  let lastLoggedElementType = null; // Prevent repetitive console logs
  let lastLoggedDimensions = null; // Prevent repetitive dimension logs
  
  // Performance monitoring
  const performanceMetrics = ref({
    updateCount: 0,
    lastUpdateTime: 0,
    averageUpdateInterval: 0,
    domQueryCount: 0
  });
  
  const trackPerformanceMetric = (metricType) => {
    const now = performance.now();
    
    if (metricType === 'update') {
      performanceMetrics.value.updateCount++;
      if (performanceMetrics.value.lastUpdateTime) {
        const interval = now - performanceMetrics.value.lastUpdateTime;
        performanceMetrics.value.averageUpdateInterval = 
          (performanceMetrics.value.averageUpdateInterval + interval) / 2;
      }
      performanceMetrics.value.lastUpdateTime = now;
    } else if (metricType === 'domQuery') {
      performanceMetrics.value.domQueryCount++;
    }
  };

  /**
   * Validates overlay bounds to prevent toolbar coverage and ensure safe positioning
   * @param {Object} bounds - Raw element bounds from getBoundingClientRect()
   * @param {String} elementType - Type of element ('VIDEO' or container element tagName)
   * @returns {Object} Validated bounds that won't interfere with UI elements
   */
  const validateBounds = (bounds, elementType) => {
    const isContainer = elementType !== 'VIDEO';
    
    // For container elements during no-signal, just ensure toolbar safety
    if (isContainer) {
      // Only fix the top position if it would cover the toolbar
      const safeTop = Math.max(bounds.top, TOOLBAR_SAFE_ZONE);
      
      const safeBounds = {
        top: safeTop,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height
      };
      
      // Positioning adjustment for toolbar coverage (logging removed)
      
      return safeBounds;
    }
    
    // For real video elements, use original bounds
    return bounds;
  };

  /**
   * Locates the optimal element for overlay positioning
   * Priority: Real video elements > video containers > fallback containers
   * @returns {HTMLElement} Element to use for overlay bounds calculation
   */
  const getVideoElement = () => {
    // First try to find actual video elements
    const videoElement =
      document.getElementById('webrtc-output') || document.getElementById('mjpeg-output');
    if (videoElement) {
      // Validate video element has reasonable dimensions before using it
      // This prevents overlay compression during HDMI activation transition
      const rect = videoElement.getBoundingClientRect();
      const currentDimensions = `${rect.width} x ${rect.height}`;
      
      if (lastLoggedDimensions !== currentDimensions) {
        lastLoggedDimensions = currentDimensions;
        // Force immediate overlay repositioning when video dimensions change significantly
        setTimeout(() => updateOverlayPosition(), 0);
      }

      // For 4K resolution, the video might be very large - let's be more permissive
      if (rect.width >= 100 && rect.height >= 100) {
        if (lastLoggedElementType !== 'video') {
          lastLoggedElementType = 'video';
        }
        return videoElement;
      }
      // Video element exists but dimensions too small - fall back to container
      lastLoggedElementType = 'container';
    }
    
    // No video element found or video not ready - use container fallback
    // Try to find the most specific video container first
    let container = document.querySelector('.video-center-wrapper');
    if (!container) {
      container = document.getElementById('appkvm');
    }
    
    // Final fallback with error handling
    if (!container) {
      console.error('Overlay: No suitable container found for positioning');
      container = document.querySelector('.main-layout') || document.body;
    }
    
    return container;
  };

  /**
   * Updates overlay position using event-driven architecture
   * - Tracks performance metrics for monitoring
   * - Uses bounds caching to prevent unnecessary updates
   * - Applies safety validation to prevent UI interference
   */
  const updateOverlayPosition = () => {
    trackPerformanceMetric('update');
    
    const element = getVideoElement();
    if (!element) {
      isVideoVisible.value = false;
      return;
    }

    trackPerformanceMetric('domQuery');
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      isVideoVisible.value = false;
      return;
    }

    const currentElementType = element.tagName;

    // Early return if bounds haven't changed (performance optimization)
    if (
      rect.top === lastBounds.top &&
      rect.left === lastBounds.left &&
      rect.width === lastBounds.width &&
      rect.height === lastBounds.height &&
      currentElementType === lastElementType
    ) {
      return;
    }

    // Create initial bounds object
    const rawBounds = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
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

  // Overlay style - positioned over video bounds
  const overlayStyle = computed(() => {
    const bounds = videoBounds.value;
    const style = {
      position: 'fixed',
      top: `${bounds.top}px`,
      left: `${bounds.left}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: zIndex.overlay, // Show overlay controls above diagnostics
      pointerEvents: 'none',
    };
    
    // Note: Overlay positioning now handled by disabling overlay during no-signal states
    return style;
  });

  // Dynamic positioning based on footer/toolbar visibility
  const topControlsPosition = computed(() => {
    // Always use consistent margin within video bounds
    return `${DEFAULT_TOP_MARGIN}px`;
  });

  const bottomControlsPosition = computed(() => {
    // Use consistent margin for both video and simulated video bounds
    return `${DEFAULT_BOTTOM_MARGIN}px`;
  });

  // Switch functionality - combine duplicate logic
  const activeChannel = computed(
    () => devicePersist.value.HDMISwitchActiveItem?.activeChannel ?? -1
  );
  const filteredChannels = computed(() => devicePersist.value.HDMISwitchActiveItem?.channels ?? []);

  // Recording functionality
  const { formattedRecordingTime, videoRecord } = useRecording(isRecording);

  // ATX functionality
  const { triggerPowerButton, atxItems } = useATX(device);

  const displayName = (channel) => {
    return channel.override && channel.override.length > 0 ? channel.override : channel.name;
  };

  const { turnOnMic, turnOffMic } = useMicrophone(device); // TODO error
  const { startCamera, stopCamera, enterPiP, exitPiP } = useCamera(device); //error

  const toggleMicrophone = () => {
    if (audio.value.isMicrophoneOn) {
      turnOffMic();
    } else {
      turnOnMic();
    }
  };

  const toggleCamera = async (videoElement) => {
    if (device.value.video.isCameraOn) {
      await stopCamera(videoElement);
    } else {
      await startCamera();
    }
  };

  const togglePiP = () => {
    if (isShowingPiP.value) {
      exitPiP(document);
      isShowingPiP.value = !isShowingPiP.value;
    } else {
      enterPiP(pipVideoElement.value);
      isShowingPiP.value = !isShowingPiP.value;
    }
  };

  const toggleCast = () => {
    isCasting.value = !isCasting.value;
  };

  const takeSnapshot = () => {
    device.value.video.isTakeScreenshot = true;
  };

  const handleVideoRecord = () => {
    videoRecord(isRecording.value);
  };

  // Debounce utility for high-frequency events
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Optimized update function with debouncing and intersection awareness
  const debouncedUpdatePosition = debounce(() => {
    // Only update if overlay is visible in viewport for performance optimization
    // Always update for critical functionality (toolbar access) regardless of intersection
    if (isOverlayIntersecting.value || !device.value.video.isHDMIActivate) {
      nextTick(updateOverlayPosition);
    }
  }, 16); // ~60fps throttling for smooth performance

  /**
   * Sets up ResizeObserver for efficient DOM change tracking
   * Replaces 30fps polling with event-driven updates
   * @returns {ResizeObserver|null} Observer instance or null if unsupported
   */
  const setupResizeObserver = () => {
    if (!window.ResizeObserver) {
      console.warn('Overlay: ResizeObserver not supported, falling back to window resize events');
      return null;
    }

    const observer = new ResizeObserver(() => {
      try {
        // Use debounced update for ResizeObserver to prevent excessive calls
        debouncedUpdatePosition();
      } catch (error) {
        console.error('Overlay: Error in ResizeObserver callback:', error);
      }
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

  // Setup IntersectionObserver for off-screen overlay detection
  const setupIntersectionObserver = () => {
    if (!window.IntersectionObserver) {
      console.warn('Overlay: IntersectionObserver not supported, skipping viewport optimization');
      return null;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        try {
          entries.forEach((entry) => {
            isOverlayIntersecting.value = entry.isIntersecting;
            // Immediate update when overlay comes back into view for responsiveness
            if (entry.isIntersecting) {
              nextTick(updateOverlayPosition);
            }
          });
        } catch (error) {
          console.error('Overlay: Error in IntersectionObserver callback:', error);
        }
      },
      {
        // Use root margin to detect earlier when overlay is going off-screen
        rootMargin: '50px',
        // Only trigger when completely in/out of view
        threshold: [0, 1]
      }
    );

    return observer;
  };

  // Setup window event listeners with optimized debouncing
  const setupWindowListeners = () => {
    // Immediate update for orientation changes (less frequent, more critical)
    const immediateUpdate = () => {
      nextTick(updateOverlayPosition);
    };

    // Use debounced version for resize events (can be very frequent)
    window.addEventListener('resize', debouncedUpdatePosition);
    // Orientation changes are less frequent and more critical - use immediate update
    window.addEventListener('orientationchange', immediateUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdatePosition);
      window.removeEventListener('orientationchange', immediateUpdate);
    };
  };


  // Watch for state changes that affect overlay positioning with smart batching
  watch([
    () => device.value.video.connectionState,
    () => settings.value.isVisible,
    () => device.value.video.videoMode
  ], () => {
    // For state changes, use immediate update as these are less frequent but more critical
    // than resize events and affect overlay positioning significantly
    nextTick(updateOverlayPosition);
  });

  // Watch for overlay being enabled/disabled - force repositioning when enabled
  watch(() => showOverlay.value, (isEnabled) => {
    if (isEnabled) {
      // Clear cache and wait for proper video element
      lastBounds = { top: 0, left: 0, width: 0, height: 0 };
      lastElementType = null;
      waitForVideoElement();
    }
  });

  // Watch for HDMI activation changes - critical for overlay positioning
  watch(() => device.value.video.isHDMIActivate, (isActive) => {
    if (isActive && showOverlay.value) {
      // Clear all cached data when HDMI state changes
      lastBounds = { top: 0, left: 0, width: 0, height: 0 };
      lastElementType = null;
      lastLoggedElementType = null;
      lastLoggedDimensions = null;
      // Wait for video element to be properly positioned after HDMI activation
      setTimeout(() => {
        waitForVideoElement();
      }, 100);
    }
  });


  // Performance reporting for development
  const getPerformanceReport = () => {
    const metrics = performanceMetrics.value;
    const report = {
      totalUpdates: metrics.updateCount,
      totalDOMQueries: metrics.domQueryCount,
      averageUpdateInterval: `${metrics.averageUpdateInterval.toFixed(2)}ms`,
      estimatedFPS: metrics.averageUpdateInterval > 0 ? 
        `${(1000 / metrics.averageUpdateInterval).toFixed(1)} fps` : 'N/A',
      domQueriesPerSecond: metrics.averageUpdateInterval > 0 ? 
        `${(metrics.domQueryCount * 1000 / (performance.now() - metrics.lastUpdateTime + metrics.averageUpdateInterval)).toFixed(1)}/sec` : 'N/A'
    };
    
    console.table(report);
    return report;
  };
  
  // Make performance report available globally for debugging
  if (typeof window !== 'undefined') {
    window.getOverlayPerformanceReport = getPerformanceReport;
  }

  // Wait for video element to be ready and properly sized before positioning overlay
  const waitForVideoElement = () => {
    const checkVideo = () => {
      const videoElement = document.getElementById('webrtc-output') || document.getElementById('mjpeg-output');
      if (videoElement) {
        const rect = videoElement.getBoundingClientRect();
        // Video must be reasonably sized (not just a tiny placeholder)
        // and positioned (not at 0,0 which indicates not ready)
        if (rect.width >= 100 && rect.height >= 100 && (rect.top > 0 || rect.left > 0)) {
          updateOverlayPosition();
          return true;
        }
      }
      return false;
    };

    // Try immediately
    if (checkVideo()) return;

    // If not ready, poll every 50ms for up to 10 seconds (more aggressive)
    let attempts = 0;
    const maxAttempts = 200;
    const interval = setInterval(() => {
      attempts++;
      if (checkVideo() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          // Fallback to container positioning if video element not ready
          updateOverlayPosition();
        }
      }
    }, 50);
  };

  // Lifecycle management - event-driven approach
  onMounted(() => {
    // Wait for video element before initial positioning
    waitForVideoElement();
    
    // Setup ResizeObserver for DOM changes
    resizeObserver.value = setupResizeObserver();
    
    // Setup IntersectionObserver for viewport optimization
    intersectionObserver.value = setupIntersectionObserver();
    
    // Start observing the overlay element for intersection
    if (intersectionObserver.value) {
      // Wait for next tick to ensure overlay element exists
      nextTick(() => {
        const overlayElement = document.querySelector('.v-overlay__content.overlay-passthrough');
        if (overlayElement) {
          intersectionObserver.value.observe(overlayElement);
        }
      });
    }
    
    // Setup window event listeners
    windowCleanup.value = setupWindowListeners();
  });

  onBeforeUnmount(() => {
    // Clean up ResizeObserver
    if (resizeObserver.value) {
      resizeObserver.value.disconnect();
      resizeObserver.value = null;
    }
    
    // Clean up IntersectionObserver
    if (intersectionObserver.value) {
      intersectionObserver.value.disconnect();
      intersectionObserver.value = null;
    }
    
    // Clean up window event listeners
    if (windowCleanup.value) {
      windowCleanup.value();
      windowCleanup.value = null;
    }
  });
</script>

<style scoped>
  .cursor-not-allowed {
    cursor: not-allowed;
    opacity: 0.6;
  }
  .green-text {
    color: #76ff03;
  }

  /* ============================================
   CSS Container Queries for Responsive Controls
   ============================================ */
   
  /* Make overlay a container for size-based queries */
  :deep(.v-overlay__content.overlay-passthrough) {
    container-type: inline-size;
    container-name: video-overlay;
  }

  /* Responsive control layout based on overlay/video size */
  @container video-overlay (min-width: 600px) {
    .overlay-control-bar {
      gap: 12px !important; /* More spacing on larger videos */
    }
    
    .control-group {
      padding: 8px 16px !important; /* Larger padding */
      gap: 12px !important;
    }
  }

  @container video-overlay (max-width: 599px) {
    .overlay-control-bar {
      gap: 6px !important; /* Tighter spacing on smaller videos */
    }
    
    .control-group {
      padding: 4px 8px !important; /* Smaller padding */
      gap: 6px !important;
    }
  }

  @container video-overlay (max-width: 400px) {
    /* Hide some non-essential controls on very small videos */
    .control-group .v-divider {
      display: none !important;
    }
    
    /* Stack controls vertically if needed */
    .overlay-control-bar[style*="right: 20px"] {
      flex-direction: column !important;
      align-items: flex-end !important;
    }
  }

  @container video-overlay (max-width: 300px) {
    /* Hide experimental controls on tiny videos */
    .control-group[data-experimental="true"] {
      display: none !important;
    }
  }

  /* ============================================
   Overlay Mouse Passthrough Architecture
   ============================================ */

  /* Base overlay - allows mouse events to pass through to KVM */
  :deep(.v-overlay__scrim) {
    pointer-events: none !important;
  }

  :deep(.v-overlay__content) {
    pointer-events: none !important;
  }

  /* More specific targeting for our overlay */
  :deep(.v-overlay__content.overlay-passthrough) {
    pointer-events: none !important;
    position: relative;
    /* Ensure cursor inheritance from parent (KVM) */
    cursor: inherit !important;
    /* No background - overlay is now exactly over video */
    background: transparent;
    /* Make sure content fills the overlay exactly */
    width: 100% !important;
    height: 100% !important;
  }

  /* Force the overlay itself to allow passthrough */
  :deep(.v-overlay) {
    pointer-events: none !important;
    /* Allow cursor to pass through */
    cursor: inherit !important;
  }

  /* Interactive control areas - only capture events on actual controls */
  .overlay-control-bar {
    pointer-events: none !important;
    background: none !important;
  }

  /* Only interactive elements within control bars capture events */
  .overlay-control-bar .v-btn,
  .overlay-control-bar .v-icon,
  .overlay-control-bar .v-slider,
  .overlay-control-bar [role='button'],
  .overlay-control-bar .v-input {
    pointer-events: auto !important;
  }

  /* Tooltip activators need events but tooltips themselves should not block */
  .overlay-control-bar .v-tooltip > .v-overlay__activator {
    pointer-events: auto !important;
  }

  .overlay-interactive {
    pointer-events: auto !important;
  }

  .overlay-interactive:hover {
    cursor: pointer !important;
  }

  /* Menu and dropdown elements - ensure clickability */
  :deep(.v-menu__content) {
    pointer-events: auto !important;
  }

  :deep(.v-overlay--active.v-menu) {
    pointer-events: auto !important;
  }

  :deep(.v-list) {
    pointer-events: auto !important;
  }

  :deep(.v-list-item) {
    pointer-events: auto !important;
  }

  :deep(.v-list-item:hover) {
    cursor: pointer !important;
  }

  /* Interactive elements maintain proper cursor behavior */
  .overlay-control-bar .v-btn:hover,
  .overlay-control-bar .v-icon:hover {
    cursor: pointer !important;
  }

  /* Add subtle background panel for each control group */
  .control-group {
    backdrop-filter: blur(4px);
    border-radius: 8px;
    padding: 6px 12px;
    margin: 0 4px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px; /* Ensure consistent height for all control groups */
  }

  /* Recording controls keep their current better appearance (no explicit background - uses Vuetify defaults) */

  /* Mic/Volume and Switch controls get consistent background */
  .overlay-control-bar .control-group:not(.recording-controls) {
    background: rgba(0, 0, 0, 0.6) !important;
  }

  /* Remove right margins from all control groups in right-aligned container */
  .overlay-control-bar[style*='right: 20px'] .control-group {
    margin-right: 0;
  }

  /* Remove all margins from switch control group */
  .control-group.switch-controls {
    margin: 0;
  }

  /* Ensure consistent sizing for all interactive elements */
  .overlay-control-bar .v-btn,
  .overlay-control-bar .v-icon {
    min-height: 32px;
    height: 32px;
  }

  /* Allow ATX power button to be slightly larger */
  .overlay-control-bar .v-btn[size='default'] {
    min-height: 36px;
    height: 36px;
  }

  /* Volume control container alignment */
  .overlay-control-bar .d-inline-flex {
    align-items: center;
    min-height: 32px;
  }

  /* Switch label styling */
  .switch-label {
    color: #76ff03;
    font-size: 14px;
    font-weight: 500;
    margin-right: 8px;
    white-space: nowrap;
  }
</style>
