<template>
  <v-overlay
    :model-value="showOverlay && isVideoVisible"
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
      style="position: absolute; top: 20px; right: 20px;"
    >
      <!-- Experimental Controls Group -->
      <div v-if="isExperimental" class="control-group">
        <KvmHandRaise />
        <KvmClipboard />
      </div>

      <!-- Recording Controls Group -->
      <div class="control-group">
        <v-tooltip location="top" content-class="">
          <template v-slot:activator="{ props: tooltipProps }">
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
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              class="text-none"
              :color="isRecording ? '#D32F2F' : '#76FF03'"
              :prepend-icon="isRecording ? 'mdi-stop' : 'mdi-radiobox-marked'"
              v-ripple
              :text="isRecording ? formattedRecordingTime : undefined"
              :variant="isRecording ? 'tonal' : 'plain'"
              size="small"
              @click="handleVideoRecord"
            >
            </v-btn>
          </template>
          <span>{{ isRecording ? t('common.stopRecording') : t('common.startRecording') }}</span>
        </v-tooltip>
      </div>
    </div>


    <div
      class="overlay-control-bar d-flex ga-3 pa-1 justify-start align-center"
      style="position: absolute; bottom: 20px; left: 20px;"
    >
      <!-- bottom control bar-->
      <div
        class="d-flex w-100 ga-3 pa-0 align-center"
      >

        <!-- Audio Controls Group -->
        <div v-if="device.video.videoMode === 'h264'" class="control-group">
          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                :color="!canUseMic ? '#9E9E9E' : audio.isMicrophoneOn ? '#76FF03' : undefined"
                :class="{ 'cursor-not-allowed': !canUseMic }"
                :size="size"
                :icon="audio.isMicrophoneOn ? 'mdi-microphone' : 'mdi-microphone-off'"
                @click="onMicClick"
              />
            </template>
            <span>{{
              canUseMic ? (audio.isMicrophoneOn ? 'Mute' : 'Unmute') : 'need to register mic first'
            }}</span>
          </v-tooltip>

          <div
            class="d-inline-flex align-center ga-2"
            @mouseenter="isHoveringVolume = true"
            @mouseleave="isHoveringVolume = false"
          >
          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                :color="isHoveringVolume || device.video.audioVolume > 0 ? '#76FF03' : undefined"
                :size="size"
                :icon="
                  device.video.audioVolume === 0 || undefined
                    ? 'mdi-volume-mute'
                    : device.video.audioVolume < 30
                      ? 'mdi-volume-low'
                      : device.video.audioVolume < 70
                        ? 'mdi-volume-medium'
                        : 'mdi-volume-high'
                "
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
        </div>

        <v-spacer />

        <!-- Switch Controls Group -->
        <div v-if="filteredChannels.length > 0" class="control-group">
          <template v-for="channel in filteredChannels" :key="channel.id">
          <v-tooltip v-if="channel.override" location="bottom" content-class="">
            <template #activator="{ props }">
              <div v-bind="props">
                <v-btn
                  size="x-small"
                  rounded
                  :color="channel.name == activeChannel ? 'primary' : 'green'"
                  @click="changeSwitchChannel(channel.name)"
                >
                  {{ channel.name }}
                </v-btn>
              </div>
            </template>
            <p>{{ displayName(channel) }}</p>
          </v-tooltip>

          <v-tooltip v-else location="bottom" content-class="">
            <template #activator="{ props }">
              <div v-bind="props">
                <v-btn
                  size="x-small"
                  rounded
                  :color="channel.name == activeChannel ? 'primary' : 'green'"
                  @click="changeSwitchChannel(channel.name)"
                >
                  {{ channel.name }}
                </v-btn>
              </div>
            </template>
            <p>{{ displayName(channel) }}</p>
          </v-tooltip>
          </template>
        </div>

        <!-- ATX Controls Group -->
        <div v-if="device.isATXActive" class="control-group">
        <v-menu location="top" v-if="device.isATXActive" :style="{ zIndex: zIndex.overlay }">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              color="#76FF03"
              prepend-icon="mdi-power-settings"
              size="default"
              rounded
              text="mytarget"
              variant="plain"
            >
            </v-btn>
          </template>

          <v-list select-strategy="leaf">
            <v-list-item
              v-for="(atxItem, atxIndex) in atxItems"
              :key="atxIndex"
              :value="atxIndex"
              active-class="text-green"
              @click="triggerPowerButton(atxItem.action)"
            >
              <v-icon :icon="atxItem.icon" color="#76FF03"></v-icon>
              {{ atxItem.title }}
            </v-list-item>
          </v-list>
        </v-menu>
        </div>

        <v-divider class="mx-3" inset vertical></v-divider>

        <!-- Experimental Controls Group -->
        <div v-if="isExperimental" class="control-group">
          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
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
            <template v-slot:activator="{ props: tooltipProps }">
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
            <template v-slot:activator="{ props: tooltipProps }">
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

          <v-divider class="mx-3" inset vertical></v-divider>
        </div>
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
  import http from '@/utils/http.js';
  import { zIndex } from '@/styles/zIndex';
  import { useHdmiSwitch } from '@/composables/useHdmiSwitch';
  import { useI18n } from 'vue-i18n';
  import { useDiagnostics } from '@/composables/useDiagnostics';
  import { useRecording } from '@/composables/useRecording';
  import { useATX } from '@/composables/useATX';

  const { startDiagnosticsConnecting } = useDiagnostics();
  const store = useAppStore();
  const { device } = useDevice();
  const { t } = useI18n();
  const { kvmSwitch, changeSwitchChannel } = useHdmiSwitch();
  // Computed property to access hdmiSwitch items
  const kvmSwitchItems = computed(() => kvmSwitch.value.items || []);
  const canUseMic = computed(() => device.value?.mic?.isRegistered === true);

  const onMicClick = () => {
    if (!canUseMic.value) return;
    toggleMicrophone();
  };

  const {
    isProcessing,
    showOverlay,
    isShowingPiP,
    isCasting,
    pipVideoElement,
    isExperimental,
    isCameraOn,
    audio,
    isRecording,
    settings,
  } = storeToRefs(store);

  defineProps({
    zIndex: {
      type: [String, Number],
      default: 1000,
    },
  });

  const isHoveringVolume = ref(false);
  const size = 25;
  
  // Video element bounds tracking for overlay positioning
  const videoBounds = ref({ top: 0, left: 0, width: 0, height: 0 });
  const isVideoVisible = ref(false);
  const resizeObserver = ref(null);
  const pollingInterval = ref(null);

  // Get the actual video element (WebRTC or MJPEG)
  const getVideoElement = () => {
    return document.getElementById('webrtc-output') || document.getElementById('mjpeg-output');
  };

  // NO debouncing - immediate updates only
  const immediateUpdateOverlayPosition = () => {
    updateOverlayPosition();
  };

  // Calculate actual video content bounds within video element (excluding black bars)
  const updateOverlayPosition = () => {
    const videoElement = getVideoElement();
    if (!videoElement) {
      isVideoVisible.value = false;
      return;
    }

    const rect = videoElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      isVideoVisible.value = false;
      return;
    }

    // Get actual video resolution from device state
    const videoWidth = device.value?.video?.resolutionWidth || 1920;
    const videoHeight = device.value?.video?.resolutionHeight || 1080;
    const videoAspectRatio = videoWidth / videoHeight;

    // Calculate video content bounds within the video element (object-fit: contain behavior)
    const elementAspectRatio = rect.width / rect.height;

    let contentWidth, contentHeight, contentLeft, contentTop;

    if (videoAspectRatio > elementAspectRatio) {
      // Video is wider than element - limited by width (letterboxed top/bottom)
      contentWidth = rect.width;
      contentHeight = rect.width / videoAspectRatio;
      contentLeft = rect.left;
      contentTop = rect.top + (rect.height - contentHeight) / 2;
    } else {
      // Video is taller than element - limited by height (pillarboxed left/right)
      contentHeight = rect.height;
      contentWidth = rect.height * videoAspectRatio;
      contentTop = rect.top;
      contentLeft = rect.left + (rect.width - contentWidth) / 2;
    }

    videoBounds.value = {
      top: contentTop,
      left: contentLeft,
      width: contentWidth,
      height: contentHeight
    };
    isVideoVisible.value = true;
  };

  // Overlay style to match video element exactly - NO transitions
  const overlayStyle = computed(() => {
    const bounds = videoBounds.value;
    return {
      position: 'fixed',
      top: `${bounds.top}px`,
      left: `${bounds.left}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: zIndex.overlay,
      pointerEvents: 'none'
    };
  });

  const activeChannel = computed(() => {
    const selectedSwitch = kvmSwitchItems.value.find(
      (item) => item.id === kvmSwitch.value.activeSwitchId
    );
    return selectedSwitch ? selectedSwitch.activeChannel : -1;
  });

  const filteredChannels = computed(() => {
    const selectedSwitch = kvmSwitchItems.value.find(
      (item) => item.id === kvmSwitch.value.activeSwitchId
    );
    return selectedSwitch ? selectedSwitch.channels : [];
  });

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

  // Watch for drawer visibility changes - IMMEDIATE updates only
  watch(() => settings.value.isVisible, () => {
    updateOverlayPosition(); // Immediate update
  });

  // Watch for video resolution changes - IMMEDIATE updates only
  watch([
    () => device.value?.video?.resolutionWidth,
    () => device.value?.video?.resolutionHeight
  ], () => {
    updateOverlayPosition();
  });

  // Set up video bounds tracking and overlay positioning
  onMounted(() => {
    // Initial overlay position update
    nextTick(() => {
      updateOverlayPosition();
    });

    // Start continuous polling to track video position changes
    pollingInterval.value = setInterval(() => {
      updateOverlayPosition();
    }, 16); // 60fps polling - tracks video position continuously

    // Set up ResizeObserver to track video element size changes - IMMEDIATE updates
    if (window.ResizeObserver) {
      resizeObserver.value = new ResizeObserver(() => {
        updateOverlayPosition(); // IMMEDIATE - no debouncing
      });

      // Start observing the video element if it exists
      const videoElement = getVideoElement();
      if (videoElement) {
        resizeObserver.value.observe(videoElement);
      }
    }

    // Set up MutationObserver to detect video element changes (H264 ↔ MJPEG)
    const mutationObserver = new MutationObserver(() => {
      const videoElement = getVideoElement();
      if (videoElement && resizeObserver.value) {
        // Re-observe the new video element
        resizeObserver.value.disconnect();
        resizeObserver.value.observe(videoElement);
        updateOverlayPosition(); // IMMEDIATE - no debouncing
      }
    });

    // Watch for changes in the video container
    const appKvmElement = document.getElementById('appkvm');
    if (appKvmElement) {
      mutationObserver.observe(appKvmElement, {
        childList: true,
        subtree: true
      });
    }

    // Listen for window resize and layout changes - IMMEDIATE updates
    window.addEventListener('resize', updateOverlayPosition);
    document.addEventListener('overlay-layout-change', updateOverlayPosition);

    // Store mutation observer for cleanup
    resizeObserver.value.mutationObserver = mutationObserver;
  });

  onBeforeUnmount(() => {
    // Clean up polling
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value);
    }
    
    // Clean up observers
    if (resizeObserver.value) {
      resizeObserver.value.disconnect();
      if (resizeObserver.value.mutationObserver) {
        resizeObserver.value.mutationObserver.disconnect();
      }
    }
    window.removeEventListener('resize', updateOverlayPosition);
    document.removeEventListener('overlay-layout-change', updateOverlayPosition);
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
  .overlay-control-bar [role="button"],
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
    background: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(4px);
    border-radius: 8px;
    padding: 6px 12px;
    margin: 0 4px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px; /* Ensure consistent height for all control groups */
  }

  /* Ensure consistent sizing for all interactive elements */
  .overlay-control-bar .v-btn,
  .overlay-control-bar .v-icon {
    min-height: 32px;
    height: 32px;
  }

  /* Allow ATX power button to be slightly larger */
  .overlay-control-bar .v-btn[size="default"] {
    min-height: 36px;
    height: 36px;
  }

  /* Volume control container alignment */
  .overlay-control-bar .d-inline-flex {
    align-items: center;
    min-height: 32px;
  }
</style>
