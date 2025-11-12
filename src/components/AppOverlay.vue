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
      <div v-if="isExperimental" class="control-group">
        <KvmHandRaise />
        <KvmClipboard />
      </div>

      <!-- Recording Controls Group -->
      <div v-if="isVideoVisible" class="control-group">
        <v-tooltip location="top" content-class="">
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

        <v-tooltip v-if="device.video.videoMode === 'h264'" location="top" content-class="">
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
        <div v-if="device.video.videoMode === 'h264' && isVideoVisible" class="control-group">
          <div
            class="d-inline-flex align-center ga-2"
            @mouseenter="isHoveringVolume = true"
            @mouseleave="isHoveringVolume = false"
          >
            <v-tooltip location="top" content-class="">
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

          <v-tooltip location="top" content-class="">
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
              canUseMic ? (audio.isMicrophoneOn ? 'Mute' : 'Unmute') : 'need to register mic first'
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
        v-if="devicePersist.isHDMISwitchActive || devicePersist.isATXActive"
        class="control-group switch-controls"
      >
        <!-- Switch Controls -->
        <template v-if="devicePersist.isHDMISwitchActive">
          <v-tooltip location="top" content-class="">
            <template #activator="{ props: tooltipProps }">
              <v-icon v-bind="tooltipProps" icon="mdi-monitor-multiple" :size="size" />
            </template>
            <span>{{ t('settings.switch.port') }}</span>
          </v-tooltip>
          <v-btn-toggle
            :model-value="activeChannel"
            color="#76FF03"
            density="compact"
            @update:model-value="changeSwitchChannel"
          >
            <template v-for="channel in filteredChannels" :key="channel.id">
              <v-tooltip location="top" content-class="">
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
        <v-tooltip v-if="devicePersist.isATXActive" location="top" content-class="">
          <template #activator="{ props: tooltipProps }">
            <v-menu location="top" :style="{ zIndex: zIndex.overlay }">
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
                  <v-icon :icon="atxItem.icon" color="#76FF03" />
                  {{ atxItem.title }}
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <span>{{ t('common.atxPower') }}</span>
        </v-tooltip>
      </div>

      <v-divider class="mx-3" inset vertical />

      <!-- Experimental Controls Group -->
      <div v-if="isExperimental" class="control-group">
        <v-tooltip location="top" content-class="">
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

        <v-tooltip location="top" content-class="">
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

        <v-divider class="mx-3" inset vertical />
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

  // Reference to simulated video element
  // Reference to simulated video element (unused for now)
  // const simulatedVideoRef = ref(null);

  // Constants for video positioning
  const POLLING_INTERVAL_MS = 33; // 30fps polling
  // const DEFAULT_VIDEO_WIDTH = 1920;
  // const DEFAULT_VIDEO_HEIGHT = 1080;

  // Constants for simulated video area when no actual video is present (use 1080p like default)
  // const SIMULATED_VIDEO_WIDTH = 1920;
  // const SIMULATED_VIDEO_HEIGHT = 1080;

  // Constants for positioning (based on perfect Case 1b standard)
  const DEFAULT_TOP_MARGIN = 20; // Top margin (from Case 1b)
  const DEFAULT_BOTTOM_MARGIN = 20; // Bottom margin (match top for symmetry)

  // Video element bounds tracking for overlay positioning
  const videoBounds = ref({ top: 0, left: 0, width: 0, height: 0 });
  const isVideoVisible = ref(false);
  const pollingInterval = ref(null);

  // Cache for performance optimization
  let lastBounds = { top: 0, left: 0, width: 0, height: 0 };
  let lastElementType = null; // Track if we switched between video/container
  let lastLoggedElementType = null; // Prevent repetitive console logs
  let lastLoggedDimensions = null; // Prevent repetitive dimension logs

  // Get the actual video element (WebRTC or MJPEG) or video container when no video
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
        // console.log('Video element dimensions:', currentDimensions);
        lastLoggedDimensions = currentDimensions;
      }

      // Use stricter validation - video must be reasonably sized
      if (rect.width >= 400 && rect.height >= 200) {
        if (lastLoggedElementType !== 'video') {
          // console.log('Using video element for overlay tracking');
          lastLoggedElementType = 'video';
        }
        return videoElement;
      }
      if (lastLoggedElementType !== 'small-video') {
        // console.log('Video element too small, using container instead');
        lastLoggedElementType = 'small-video';
      }
      // Video element exists but dimensions too small - fall back to container
    }

    // No video element found or video not ready - use the video container instead
    // This allows overlay to track the same container that naturally responds to footer changes
    const container =
      document.getElementById('appkvm') || document.querySelector('.video-center-wrapper');
    if (container && lastLoggedElementType !== 'container') {
      // console.log('Using container for overlay tracking');
      lastLoggedElementType = 'container';
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
    if (
      rect.top === lastBounds.top &&
      rect.left === lastBounds.left &&
      rect.width === lastBounds.width &&
      rect.height === lastBounds.height &&
      currentElementType === lastElementType
    ) {
      return;
    }

    // Use element bounds directly - works for both video and container
    videoBounds.value = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    // Track whether we found a real video element
    isVideoVisible.value = element.tagName === 'VIDEO';
    lastBounds = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    lastElementType = currentElementType;
  };

  // Get effective video bounds (uses tracked bounds from updateOverlayPosition)
  const getEffectiveVideoBounds = () => {
    // Always use the tracked bounds - works for both real video and container
    return videoBounds.value;
  };

  // Overlay style - positioned over video bounds (actual or simulated)
  const overlayStyle = computed(() => {
    // Get effective bounds (real video or simulated 1920x1080 area)
    const bounds = getEffectiveVideoBounds();

    const style = {
      position: 'fixed',
      top: `${bounds.top}px`,
      left: `${bounds.left}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: zIndex.overlay, // Show overlay controls above diagnostics
      pointerEvents: 'none',
    };

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

  // Watch for drawer visibility changes (force immediate update)
  watch(
    () => settings.value.isVisible,
    () => {
      updateOverlayPosition();
    }
  );

  // Lifecycle management - simplified
  onMounted(() => {
    nextTick(updateOverlayPosition);

    // 30fps polling - sufficient for smooth tracking
    pollingInterval.value = setInterval(updateOverlayPosition, POLLING_INTERVAL_MS);
  });

  onBeforeUnmount(() => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
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
