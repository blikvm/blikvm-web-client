<template>
  <v-speed-dial location="left center" open-on-hover transition="tab-transition">
    <template #activator="{ props: activatorProps }">
      <v-tooltip content-class="" location="bottom">
        <template #activator="{ props: tooltipProps }">
          <v-fab
            v-bind="mergeProps(activatorProps, tooltipProps)"
            size="small"
            icon="mdi-chart-line"
            color="success"
          />
        </template>
        <span>{{ $t('device.metrics') }}</span>
      </v-tooltip>
    </template>

    <div style="margin-left: 40px">
      <v-btn
        v-for="target in iconDataList"
        :key="target.icon"
        v-tooltip:bottom="target.tooltip"
        :text="target.text"
        color="success"
        size="x-small"
        style="margin-left: 5px"
      />
    </div>
  </v-speed-dial>
</template>

<script setup>
  import { computed } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { useI18n } from 'vue-i18n';
  import { mergeProps } from 'vue';
  import { useRoute } from 'vue-router';

  const route = useRoute();
  const store = useAppStore();

  const device = computed(() => {
    const deviceId = parseInt(route.params.id); // Get the id from the route params
    console.log(deviceId);
    const foundDevice = store.devices.find((d) => d.deviceId === deviceId); // Find the device by id

    return foundDevice; // Return the found device or undefined if not found
  });

  const { t } = useI18n();

  const iconDataList = computed(() => {
    if (!device.value) return [];
    return [
      {
        text: `${device.value.networkLatency} ms`,
        color: "device.health.isPowerLedActive ? 'success' : 'error'",
        tooltip: t('device.networkLatency'),
      },
      {
        text: `${device.value.video.resolution}@${device.value.video.sourceFps} fps`,
        color: "device.health.isPowerLedActive ? 'success' : 'success'",
        tooltip: t('video.resolution'),
      },
      {
        text: `${device.value.uptime}`,
        color: "device.isPowerLedActive ? 'success' : 'error'",
        tooltip: t('settings.device.general.uptime'),
      },
    ];
  });
</script>
