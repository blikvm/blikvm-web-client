<template>
  <v-card class="custom-card-disavbled mx-auto wrap-text" width="auto" @click.stop="keepMenuOpen">
    <v-sheet elevation="5" class="inner-sheet pa-4 mx-auto" width="100%">
      <v-sheet class="scrollable-container pa-4 text-center mx-auto" max-width="800" width="100%">
        <v-form ref="form">
          <v-row no-gutters class="d-flex justify-start align-center">
            <v-col>
              <v-switch
                v-model="device.video.isActive"
                inset
                :label="$t('settings.device.video.isHDMIActivateField')"
                density="compact"
                v-ripple
                color="#76FF03"
                @update:modelValue="toggleVideo"
              />
            </v-col>
          </v-row>

          <v-row no-gutters class="d-flex justify-start align-center" v-if="isExperimental">
            <v-col>
              <v-switch
                v-model="device.video.excludeFromStreaming"
                inset
                :label="$t('device.video.excludeFromStreamingField')"
                density="compact"
                v-ripple
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
                v-model="device.video.videoMode"
                density="compact"
                rounded="lg"
                v-ripple
                color="#76FF03"
                variant="outlined"
                group
              >
                <v-btn
                  v-if="device.board.type === '4B' || device.board.type === 'CM4'"
                  value="h264"
                >
                  h264
                </v-btn>
                <v-tooltip v-else text="Tooltip" content-class="">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" value="h264"> h264 </v-btn>
                  </template>
                  Not supported on this device
                </v-tooltip>
                <v-btn value="mjpeg"> MJPEG </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>

          <br /><br />
          <div class="d-flex text-caption justify-start">
            {{ $t('settings.device.video.resolutionField') }}
          </div>
          <v-row dense no-gutters v-if="device.board.type === '4B' || device.board.type === 'CM4'">
            <v-col>
              <v-text-field
                v-model="device.video.resolution"
                readonly
                :label="$t('settings.device.video.resolutionField')"
                density="compact"
                tile
                rounded="lg"
                color="#76FF03"
                variant="plain"
                hide-details
                single-line
              >
                <template v-slot:append>
                  <div
                    style="
                      display: flex;
                      align-items: center;
                      margin-left: 8px;
                      font-size: 0.85rem;
                      color: #76ff03;
                      font-weight: 500;
                    "
                  >
                    {{ device.video.capturedFps }} Hz
                  </div>
                </template>
              </v-text-field>
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
                @update:modelValue="setResolution"
              />
            </v-col>
          </v-row>

          <br />

          <div class="d-flex text-caption justify-start">Orientation</div>

          <v-row dense no-gutters class="d-flex justify-start align-center">
            <v-col cols="auto">
              <v-btn-toggle
                v-model="device.video.orientation"
                density="compact"
                rounded="lg"
                v-ripple
                color="#76FF03"
                variant="outlined"
                divided
                @click="setOrientation(device.video.orientation)"
              >
                <v-btn value="0"> 0°</v-btn>
                <v-btn value="180"> 180° </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>

          <br /><br />

          <!-- EDID Selection -->
          <div class="d-flex text-caption justify-start">EDID Configuration</div>

          <v-row v-if="device.version !== 'v4'" dense no-gutters class="mt-2">
            <v-col cols="12">
              <v-select
                v-model="selectedEdid"
                :items="edidOptions"
                item-title="label"
                item-value="value"
                color="#76FF03"
                density="compact"
                variant="outlined"
                :disabled="false"
                @update:modelValue="setEdidProfile"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:title>
                      <div class="d-flex align-center justify-space-between w-100">
                        <span>{{ item.raw.label }}</span>
                        <v-chip
                          v-if="item.raw.audioSupport === true"
                          size="x-small"
                          color="success"
                          variant="outlined"
                        >
                          Audio
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <div class="d-flex align-center">
                    <span>{{ item.raw.label }}</span>
                    <v-chip
                      v-if="item.raw.audioSupport === true"
                      size="x-small"
                      color="success"
                      variant="outlined"
                      class="ml-2"
                    >
                      Audio
                    </v-chip>
                  </div>
                </template>
              </v-select>
            </v-col>
          </v-row>

          <div class="d-flex text-caption justify-start">Upload Custom EDID (.hex file)</div>
          <v-row dense no-gutters class="mt-2">
            <v-col cols="12">
              <v-file-input
                v-model="customEdidFile"
                accept=".hex"
                density="compact"
                variant="outlined"
                color="#76FF03"
                prepend-icon=""
                prepend-inner-icon="mdi-file-upload"
                :disabled="false"
                @update:modelValue="handleCustomEdidUpload"
                hide-details
              >
                <template v-slot:append>
                  <v-tooltip
                    text="Upload a custom EDID .hex file for specific display requirements"
                  >
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" size="small" color="#76FF03"> mdi-information </v-icon>
                    </template>
                  </v-tooltip>
                </template>
              </v-file-input>
            </v-col>
          </v-row>

          <br />

          <!-- FPS (Frames per Second) -->
          <div v-if="device.video.videoMode === 'mjpeg'">
            {{ $t('settings.device.video.mjpegQualityField') }}
          </div>

          <v-row v-if="device.video.videoMode === 'mjpeg'">
            <v-col cols="12">
              <v-slider
                v-model="device.video.desiredFps"
                :max="60"
                :step="10"
                show-ticks="always"
                tick-size="2"
                v-ripple
                color="#76FF03"
                track-fill-color="#76FF03"
                @click:revert="handleRefreshClick('mjpegFps')"
                @end="setStreamFPS"
                :disabled="device.video.isRequesting"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="device.video.desiredFps"
                    readonly
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    style="width: 94px"
                    type="number"
                    suffix="FPS"
                    variant="outlined"
                    hide-details
                    single-line
                  ></v-text-field>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- quality -->
          <div
            v-if="
              device.video.videoMode === 'mjpeg' &&
              (device.board.type === '4B' || device.board.type === 'CM4')
            "
            class="d-flex text-caption justify-start"
          >
            {{ $t('settings.device.video.mjpegQualityField') }}
          </div>

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
                :min="10"
                :max="100"
                :step="10"
                show-ticks="always"
                tick-size="2"
                v-ripple
                color="#76FF03"
                track-fill-color="#76FF03"
                @click:revert="handleRefreshClick('mjpegQuality')"
                @end="setStreamQuality"
                :disabled="device.video.isRequesting"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="device.video.mjpegQuality"
                    readonly
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    style="width: 90px"
                    type="number"
                    suffix="%"
                    variant="outlined"
                    hide-details
                    single-line
                  ></v-text-field>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- WebRTC Bitrate -->
          <div class="d-flex text-caption justify-start">
            {{ $t('settings.device.video.WebRTCBitrateField') }}
          </div>

          <v-row v-if="device.video.videoMode === 'h264'">
            <v-col cols="12">
              <v-slider
                v-model="device.video.WebRTCMbps"
                :min="0.1"
                :max="10"
                :step="0.1"
                show-ticks="always"
                tick-size="2"
                v-ripple
                color="#76FF03"
                track-fill-color="#76FF03"
                @click:revert="handleRefreshClick('WebRTCFps')"
                @end="setStreamBitrate"
                :disabled="device.video.isRequesting"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="device.video.WebRTCMbps"
                    readonly
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    style="width: 123px"
                    type="number"
                    suffix="Mbps"
                    variant="outlined"
                    hide-details
                    single-line
                  ></v-text-field>
                </template>
              </v-slider>
            </v-col>
          </v-row>

          <!-- WebRTC Gop -->
          <div v-if="device.video.videoMode === 'h264'" class="d-flex text-caption justify-start">
            {{ $t('settings.device.video.WebRTCGopField') }}
          </div>

          <v-row v-if="device.video.videoMode === 'h264'">
            <v-col cols="12">
              <v-slider
                v-model="device.video.WebRTCGop"
                :max="60"
                :min="1"
                :step="1"
                show-ticks="always"
                tick-size="2"
                v-ripple
                color="#76FF03"
                track-fill-color="#76FF03"
                @click:revert="handleRefreshClick('WebRTCGop')"
                @end="setStreamGOP"
                :disabled="device.video.isRequesting"
              >
                <template v-slot:append>
                  <v-text-field
                    v-model="device.video.WebRTCGop"
                    readonly
                    density="compact"
                    rounded="lg"
                    v-ripple
                    color="#76FF03"
                    style="width: 104px"
                    type="number"
                    variant="outlined"
                    hide-details
                    single-line
                  ></v-text-field>
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
  import { ref, onMounted, computed, watch } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { useDevice } from '@/composables/useDevice';
  import { useVideoResolution } from '@/composables/useVideoResolution';
  import { useOrientation } from '@/composables/useOrientation';
  import { useAlert } from '@/composables/useAlert';
  import { storeToRefs } from 'pinia';
  import http from '@/utils/http';

  const { device } = useDevice();
  const store = useAppStore();
  const { isExperimental } = storeToRefs(store);
  const { sendAlert } = useAlert();

  // Define the props and use v-model binding
  const props = defineProps({
    label: String,
    index: Number,
    modelValue: Boolean, // Auto-bound for v-model:is-menu-visible
  });

  const emit = defineEmits(['update:modelValue']);
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
  const isRequesting = ref(false);

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
  const videoMode = computed(() => device.value.video.videoMode);

  // EDID Configuration
  const selectedEdid = ref('v3.1080p');
  const customEdidFile = ref(null);

  const edidOptions = ref([
    {
      label: 'BliKVM v3 (1920x1080 @ 50Hz)',
      value: 'v3.1080p',
      description: 'BliKVM v3 with 1080p default - 1920x1080@50Hz with audio support',
    },
    {
      label: 'BliKVM v3 (1920x1200 @ 50Hz)',
      value: 'v3.1200p',
      description: 'BliKVM v3 with 1080p default - 1920x1080@50Hz with audio support',
    },
    {
      label: 'BliKVM v3 (1920x1080 @ 50Hz + Audio)',
      value: 'v3.1080p-audio',
      description: 'BliKVM v3 with 1080p default - 1920x1080@50Hz with audio support',
    },
    {
      label: 'BliKVM v3 (1920x1200 @ 50Hz + Audio)',
      value: 'v3.1200p-audio',
      description: 'Standard BliKVM V3 EDID - max 1280x720@60Hz with audio support',
    },
    {
      label: 'BliKVM v1/v2 (1920x1080 @ 60Hz)',
      value: 'v1v2.1080p',
      description: 'BliKVM v1/v2 EDID - max 1920x1080@50Hz without audio support',
    },
    {
      label: 'BliKVM v1/v2 (1920x1200 @ 60Hz)',
      value: 'v1v2.1200p',
      description: 'BliKVM v1/v2 EDID - max 1920x1080@50Hz without audio support',
    },
    {
      label: 'BliKVM v1/v2 (1920x1080 @ 60Hz +  Audio)',
      value: 'v1v2.1080p-audio',
      description: 'BliKVM v1/v2 EDID - max 1920x1080@50Hz without audio support',
    },
    {
      label: 'BliKVM v1/v2 (1920x1200 @ 60Hz + Audio)',
      value: 'v1v2.1200p-audio',
      description: 'BliKVM v1/v2 with 1080p - 1920x1200@50Hz without audio support',
    },
  ]);

  watch(videoMode, (newMode) => {
    localStorage.setItem('videoMode', newMode);
  });

  onMounted(() => {
    console.log('SettingsVideo mounted');
    console.log('selectedEdid:', selectedEdid.value);
    console.log('edidOptions:', edidOptions.value);
    console.log('device.video:', device.value?.video);
    getVideoConfig();
    getCurrentEdidProfile();
  });

  // Method to keep the menu open
  const keepMenuOpen = (event) => {
    // You can add additional logic here if needed
    event.stopPropagation(); // Stop the event from bubbling up
  };

  // EDID Methods
  const getCurrentEdidProfile = async () => {
    try {
      const response = await http.get('/video/edid');
      if (response.status === 200 && response.data.code === 0) {
        // Try to match current EDID to predefined options
        // For now, just set to v3 if we can't determine
        selectedEdid.value = 'v3';
      }
    } catch (error) {
      console.error('Error getting EDID profile:', error);
    }
  };

  const setEdidProfile = async (profileValue) => {
    console.log('setEdidProfile called with:', profileValue);
    if (!profileValue) return;

    try {
      isRequesting.value = true;
      const response = await http.post('/video/edid/profile', {
        profile: profileValue,
      });

      if (response.status === 200 && response.data.code === 0) {
        sendAlert(
          'success',
          'EDID Profile Updated',
          `Successfully applied ${profileValue} EDID profile`
        );
      } else {
        sendAlert(
          'error',
          'EDID Profile Error',
          response.data.msg || 'Failed to apply EDID profile'
        );
      }
    } catch (error) {
      console.error('Error setting EDID profile:', error);
      sendAlert('error', 'EDID Profile Error', error.message);
    } finally {
      isRequesting.value = false;
    }
  };

  const handleCustomEdidUpload = async (files) => {
    console.log('handleCustomEdidUpload called with:', files);
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.hex')) {
      sendAlert('error', 'Invalid File', 'Please upload a .hex file');
      return;
    }

    try {
      isRequesting.value = true;
      const formData = new FormData();
      formData.append('edid', file);

      const response = await http.post('/video/edid/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 && response.data.code === 0) {
        selectedEdid.value = 'custom';
        sendAlert(
          'success',
          'Custom EDID Uploaded',
          'Successfully uploaded and applied custom EDID file'
        );
        customEdidFile.value = null; // Clear the file input
      } else {
        sendAlert('error', 'EDID Upload Error', response.data.msg || 'Failed to upload EDID file');
      }
    } catch (error) {
      console.error('Error uploading custom EDID:', error);
      sendAlert('error', 'EDID Upload Error', error.message);
    } finally {
      isRequesting.value = false;
    }
  };

  const cancel = async () => {
    try {
    } catch (error) {
      console.error('Error during cancel operation:', error);
    }
  };

  // !! TODO you have to think when you want to process the user's changes. Directly or centrally (with OK button)
  // For me it should be centrally

  const save = async () => {
    try {
    } catch (error) {
      console.error('Error during save operation:', error);
    }
  };
</script>

<style scoped>
  .selected-orientation {
    background-color: #76ff03 !important;
    color: black !important;
  }
</style>
