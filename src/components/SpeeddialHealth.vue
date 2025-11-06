<template>
  <v-speed-dial location="left center" open-on-hover transition="tab-transition">
    <template v-slot:activator="{ props: activatorProps }">
      <v-tooltip content-class="" location="bottom">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-fab
            v-bind="mergeProps(activatorProps, tooltipProps)"
            size="small"
            icon="mdi-heart-pulse"
            :color="healthIconColor"
            content-class=""
          />
        </template>
        <span>{{ $t('device.health') }}</span>
      </v-tooltip>
    </template>

    <div style="margin-left: 40px">
      <v-btn
        v-for="iconData in iconDataList"
        :key="iconData.icon"
        :icon="iconData.icon"
        :color="iconData.color"
        v-tooltip:bottom="iconData.tooltip"
        size="x-small"
        @click="iconData.onClick"
        style="margin-left: 5px"
      >
      </v-btn>
    </div>
  </v-speed-dial>
</template>

<script setup>
  import { ref, watch } from 'vue';
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';
  import { useI18n } from 'vue-i18n';
  import { useTemperature } from '@/composables/useTemperature.js';
  import { mergeProps } from 'vue';

  const route = useRoute();
  const store = useAppStore();
  const { t } = useI18n();

  const { isProcessing, preferences } = storeToRefs(store);

  const device = computed(() => {
    const deviceId = parseInt(route.params.id); // Get the id from the route params
    console.log(deviceId);
    const foundDevice = store.devices.find((d) => d.deviceId === deviceId); // Find the device by id

    return foundDevice; // Return the found device or undefined if not found
  });

  const healthIconColor = computed(() => {
    switch (device.value.health.status) {
      case 'Good':
        return 'green'; // or 'primary' if you want to use Vuetify's theme colors
      case 'Degraded':
        return 'orange';
      case 'Critical':
        return 'red';
      default:
        return 'red'; // Default color if status is unknown
    }
    return '';
  });

  const { convertTemperature } = useTemperature(device);

  const iconDataList = computed(() => {
    if (!device.value) return [];
    return [
      /*
    {
      // TODO here we can use the pong result??
      icon: device.value.isConnected
        ? "mdi-lan-disconnect"
        : "mdi-lan-connect",
      color: device.value.isConnected ? "error" : "success",
      title: `LAN ${
        device.value.isConnected ? "disconnected" : "connected"
      }`,
    },
    // Conditionally add the audio entry
    ...(video.value.videoMode === "h264"
      ? [
          {
            icon: video.audioMuted ? "mdi-volume-mute" : "mdi-volume-source",
            color: "success",
            title: `Audio ${
              video.audioMuted ? "muted" : `volume ${video.audioVolume}`
            }`,
          },
        ]
      : []),
*/
      {
        icon: device.value.health.hasUndervoltage ? 'mdi-flash-alert' : 'mdi-flash',
        color: !device.value.isConnected && device.value.hasUndervoltage ? 'error' : 'success',
        tooltip: device.value.health.hasUndervoltage ? 'Low voltage' : 'No under voltage',
      },
      {
        icon:
          device.value.health.temperature < device.value.health.temperatureThreshold
            ? 'mdi-thermometer-chevron-down'
            : 'mdi-thermometer-chevron-up',
        color:
          !device.value.isConnected &&
          device.value.health.temperature < device.value.health.temperatureThreshold
            ? 'success'
            : 'error',
        tooltip: `${convertTemperature(device)}° ${settings.value.temperatureUnit}`,
      },
      {
        icon: 'mdi-server',
        color:
          !device.value.isConnectedvalue && device.value.health.isHDDActive ? 'success' : 'error',
        tooltip: `Storage ${device.value.health.isHDDActive ? 'active' : 'inactive'}`,
      },
      {
        icon: device.value.health.isPowerLedActive ? 'mdi-led-variant-on' : 'mdi-led-variant-off',
        color:
          !device.value.isConnected && device.value.health.isPowerLedActive ? 'success' : 'error',
        tooltip: `Power LED ${device.value.health.isPowerLedActive ? 'active' : 'inactive'}`,
      },
      {
        icon: 'fa fa-pencil-square',
        color: !device.value.isConnected && device.value.health.isFSReadOnly ? 'success' : 'error',
        tooltip: device.value.health.isFSReadOnly ? 'Readonly' : 'Read/Writable',
      },
    ];
  });
</script>
