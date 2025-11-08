<template>
  <v-speed-dial location="left center" transition="tab-transition">
    <template #activator="{ props: activatorProps }">
      <v-fab
        v-if="isUpdateAvailable"
        v-tooltip:bottom="'BliKVM Update'"
        v-bind="activatorProps"
        size="small"
        icon="mdi-download"
        color="success"
        @click="handleClick"
      />
    </template>
    {{ $t('device.update') }}
  </v-speed-dial>
</template>

<script setup>
  import { storeToRefs } from 'pinia';
  import { useAppStore } from '@/stores/stores';

  const store = useAppStore();
  const { isUpdateAvailable, showUpdateDialog } = storeToRefs(store);

  const handleClick = () => {
    showUpdateDialog.value = !showUpdateDialog.value;
  };
</script>
