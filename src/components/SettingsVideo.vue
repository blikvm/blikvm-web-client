<template>
  <v-card class="custom-card-disavbled mx-auto wrap-text" width="auto" @click.stop="keepMenuOpen">
    <v-sheet elevation="5" class="inner-sheet pa-4 mx-auto" width="100%">
      <v-sheet class="scrollable-container pa-4 text-center mx-auto" max-width="800" width="100%">
        <v-form ref="form">
          <v-row no-gutters class="d-flex justify-start align-center">
            <v-col>
              <v-switch
                v-model="device.video.isActive"
                v-ripple
                inset
                :label="$t('settings.device.video.isHDMIActivateField')"
                density="compact"
                color="#76FF03"
                @update:model-value="toggleVideo"
              />
            </v-col>
          </v-row>

          <v-row v-if="isExperimental" no-gutters class="d-flex justify-start align-center">
            <v-col>
              <v-switch
                v-model="device.video.excludeFromStreaming"
                v-ripple
                inset
                :label="$t('device.video.excludeFromStreamingField')"
                density="compact"
                color="#76FF03"
              />
            </v-col>
          </v-row>

          <br />

          <!-- video mode -->
          <div class="d-flex text-caption justify-start">
            {{ $t('settings.device.video.modeField') }}
          </div>
          <v-row dense no-gutters class="d-flex justify-start align-center">
            <v-col cols="auto">
              <v-btn-toggle
                v-ripple
                :model-value="localVideoMode"
                density="compact"
                rounded="lg"
                color="#76FF03"
                variant="outlined"
                group
              >
                <v-btn
                  v-if="device.board.type === '4B' || device.board.type === 'CM4'"
                  value="h264"
                  @click="handleVideoModeChange('h264')"
                >
                  h264
                </v-btn>
                <v-tooltip v-else text="Tooltip" content-class="">
                  <template #activator="{ slotProps }">
                    <v-btn v-bind="slotProps" value="h264" @click="handleVideoModeChange('h264')">
                      h264
                    </v-btn>
                  </template>
                  Not supported on this device
                </v-tooltip>
                <v-btn value="mjpeg" @click="handleVideoModeChange('mjpeg')"> MJPEG </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>

          <br /><br />

          <!-- Input Format Section -->
          <v-row>
             <v-col cols="auto">
             <div class="text-caption">
              {{ $t('settings.device.video.HDMIInput') }}
            </div>
            </v-col>
          </v-row>

          <v-row dense no-gutters v-if="device.board.type === '4B' || device.board.type === 'CM4'">
            <v-col cols="6" class="d-flex align-center">
              <span class="text-caption">{{ $t('settings.device.video.resolution') }}</span>
            </v-col>
            <v-col cols="6" class="d-flex align-center justify-end">
              <span class="metric-display">{{ device.video.resolution }}@{{ device.video.sourceFps }}Hz</span>
            </v-col>
          </v-row>
          
          <v-row dense no-gutters v-else>
            <v-col cols="12">
              <v-select
                v-model="device.video.resolution"
                :items="resolutionOptions"
                item-title="text"
                item-value="value"
                :disabled="!device.video.isActive"
                color="#76FF03"
                density="compact"
                variant="outlined"
                tile
                @update:model-value="setResolution"
              />
            </v-col>
          </v-row>

          <!-- Live Format Section -->
          <v-row v-if="device.video.videoMode === 'h264'" dense no-gutters>
            <v-col cols="6" class="d-flex align-center">
              <span class="text-caption">{{ $t('settings.device.video.liveFormat') }}</span>
            </v-col>
            <v-col cols="6" class="d-flex align-center justify-end">
              <span class="metric-display"
                >{{ device.video.bitrate }}kbps / {{ device.video.streamFps }}fps</span
              >
            </v-col>
          </v-row>

          <br /><br />
          <div class="d-flex text-caption justify-start">
            {{ $t('settings.device.video.orientation') }}
          </div>

          <v-row dense no-gutters class="d-flex justify-start align-center">
            <v-col cols="auto">
              <v-btn-toggle
                v-model="device.video.orientation"
                v-ripple
                density="compact"
                rounded="lg"
                color="#76FF03"
                variant="outlined"
                divided
                @click="setOrientation(device.video.orientation)"
              >
                <v-btn value="0"> 0° </v-btn>
                <v-btn value="180"> 180° </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>

          <br /><br />

          <!-- FPS (Frames per Second) -->
          <v-row v-if="device.video.videoMode === 'mjpeg'">
            <div class="text-caption">
              {{ $t('settings.device.video.desiredFpsField') }}
            </div>
            <v-col cols="12">
              <v-slider
                v-model="device.video.desiredFps"
                v-ripple
                :max="60"
                :step="10"
                show-ticks="always"
                tick-size="2"
                color="#76FF03"
                track-fill-color="#76FF03"
                :disabled="device.video.isRequesting"
                @click:revert="handleRefreshClick('mjpegFps')"
                @end="setStreamFPS"
              >
                <template #append>
                  <v-text-field
                    v-model="device.video.desiredFps"
                    v-ripple
                    readonly
                    density="compact"
                    rounded="lg"
                    color="#76FF03"
                    style="width: 94px"
                    type="number"
                    suffix="FPS"
                    variant="outlined"
                    hide-details
                    single-line
                  />
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- quality -->
          <v-row
            v-if="
              device.video.videoMode === 'mjpeg' &&
              (device.board.type === '4B' || device.board.type === 'CM4')
            "
          >
            <div class="text-caption">
              {{ $t('settings.device.video.mjpegQualityField') }}
            </div>
            <v-col cols="12">
              <v-slider
                v-model="device.video.mjpegQuality"
                v-ripple
                :min="10"
                :max="100"
                :step="10"
                show-ticks="always"
                tick-size="2"
                color="#76FF03"
                track-fill-color="#76FF03"
                :disabled="device.video.isRequesting"
                @click:revert="handleRefreshClick('mjpegQuality')"
                @end="setStreamQuality"
              >
                <template #append>
                  <v-text-field
                    v-model="device.video.mjpegQuality"
                    v-ripple
                    readonly
                    density="compact"
                    rounded="lg"
                    color="#76FF03"
                    style="width: 90px"
                    type="number"
                    suffix="%"
                    variant="outlined"
                    hide-details
                    single-line
                  />
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- WebRTC Bitrate -->
          <v-row v-if="device.video.videoMode === 'h264'">
            <div class="text-caption">
              {{ $t('settings.device.video.WebRTCBitrateField') }}
            </div>
            <v-col cols="12">
              <v-slider
                v-model="device.video.WebRTCMbps"
                v-ripple
                :min="0.1"
                :max="10"
                :step="0.1"
                show-ticks="always"
                tick-size="2"
                color="#76FF03"
                track-fill-color="#76FF03"
                :disabled="device.video.isRequesting"
                @click:revert="handleRefreshClick('WebRTCFps')"
                @end="setStreamBitrate"
              >
                <template #append>
                  <v-text-field
                    v-model="device.video.WebRTCMbps"
                    v-ripple
                    readonly
                    density="compact"
                    rounded="lg"
                    color="#76FF03"
                    style="width: 123px"
                    type="number"
                    suffix="Mbps"
                    variant="outlined"
                    hide-details
                    single-line
                  />
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- WebRTC Gop -->
          <v-row v-if="device.video.videoMode === 'h264'">
            <div class="text-caption">
              {{ $t('settings.device.video.WebRTCGopField') }}
            </div>
            <v-col cols="12">
              <v-slider
                v-model="device.video.WebRTCGop"
                v-ripple
                :max="60"
                :min="0"
                :step="1"
                show-ticks="always"
                tick-size="2"
                color="#76FF03"
                track-fill-color="#76FF03"
                :disabled="device.video.isRequesting"
                @click:revert="handleRefreshClick('WebRTCGop')"
                @end="setStreamGOP"
              >
                <template #append>
                  <v-text-field
                    v-model="device.video.WebRTCGop"
                    v-ripple
                    readonly
                    density="compact"
                    rounded="lg"
                    color="#76FF03"
                    style="width: 104px"
                    type="number"
                    variant="outlined"
                    hide-details
                    single-line
                  />
                </template>
              </v-slider>
            </v-col>
          </v-row>
        </v-form>
      </v-sheet>
    </v-sheet>
  </v-card>
  <!--
    </v-menu>
    -->
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { useDevice } from '@/composables/useDevice';
  import { useVideoResolution } from '@/composables/useVideoResolution';
  import { useOrientation } from '/src/composables/useOrientation.js';
  import { storeToRefs } from 'pinia';
  import { useVideo } from '@/composables/useVideo';

  const { device } = useDevice();
  const store = useAppStore();
  const { isExperimental } = storeToRefs(store);
  const { initVideo, destroyJanusConnection, clearImageSource, initMjpeg } = useVideo();

  // Define the props and use v-model binding
  // Props are declared for parent binding but not used locally
  defineProps({
    label: { type: String, default: '' },
    index: { type: Number, default: 0 },
    modelValue: { type: Boolean, default: false }, // Auto-bound for v-model:is-menu-visible
  });

  // Removed unused emit (no v-model updates triggered here). Re-add if component needs to emit later.
  const {
    getVideoConfig,
    toggleVideo,
    setStreamFPS,
    setStreamBitrate,
    setStreamGOP,
    setStreamQuality,
    setResolution,
  } = useVideoResolution(device);
  const { setOrientation } = useOrientation(device);

  // Mapping available resolution options from the store
  const resolutionOptions = ref([
    '1920x1080',
    '1600x1200',
    '1360x768',
    '1280x1024',
    '1280x960',
    '1280x720',
    '800x600',
    '720x480',
    '640x480',
  ]);

  // 本地 videoMode 状态
  const localVideoMode = ref(device.value.video.videoMode);

  // 切换 videoMode 时先清理再赋值
  function handleVideoModeChange(mode) {
    if (mode === device.value.video.videoMode) return;
    if (mode === 'h264') {
      clearImageSource(); // stop MJPEG
      device.value.video.videoMode = mode;
      localVideoMode.value = mode;
      initVideo(); // start Janus WebRTC
    } else if (mode === 'mjpeg') {
      destroyJanusConnection(); // stop Janus WebRTC
      device.value.video.videoMode = mode;
      localVideoMode.value = mode;
      initMjpeg(); // start MJPEG
    }
    localStorage.setItem('videoMode', mode);
  }

  onMounted(() => {
    getVideoConfig();
  });

  // Method to keep the menu open
  const keepMenuOpen = (event) => {
    // You can add additional logic here if needed
    event.stopPropagation(); // Stop the event from bubbling up
  };
</script>

<style scoped>
  .selected-orientation {
    background-color: #76ff03 !important;
    color: black !important;
  }

  .metric-display {
    display: flex;
    align-items: center;
    margin-left: 8px;
    font-size: 0.85rem;
    color: #76ff03;
    font-weight: 500;
  }
</style>
