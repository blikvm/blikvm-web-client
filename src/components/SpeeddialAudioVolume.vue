<template>
  <v-speed-dial location="bottom end" open-on-hover transition="tab-transition">
    <template #activator="{ props: activatorProps }">
      <v-tooltip content-class="" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-fab
            v-bind="mergeProps(activatorProps, tooltipProps)"
            size="small"
            :icon="device.video.audioMuted ? 'mdi-volume-mute' : 'mdi-volume-source'"
            :color="device.video.audioMuted || device.isDisconnected ? 'error' : 'success'"
            @click="toggleAudio"
          />
        </template>
        <span>
          {{ device.video.audioMuted ? 'muted' : `volume ${device.video.audioVolume}` }}
        </span>
      </v-tooltip>
    </template>
  </v-speed-dial>
</template>

<script setup>
  import { useDevice } from '@/composables/useDevice';
  import { mergeProps } from 'vue';

  const { device } = useDevice();

  const toggleAudio = () => {
    device.value.video.audioVolume = 0;
  };
</script>
