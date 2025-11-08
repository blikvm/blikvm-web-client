<template>
  <v-overlay
    :model-value="showDiagnostics"
    :opacity="0"
    contained
    content-class="d-flex flex-column align-center justify-end w-100 h-100"
  >
    <v-spacer />

    <!-- Center control bar -->
    <v-fade-transition>
      <div class="position-absolute" style="top: 50%; left: 50%; transform: translate(-50%, -50%)">
        <v-btn icon="undefined" size="180" border="xl" variant="text" />
      </div>
    </v-fade-transition>
    <div class="no-signal">
      {{ $t('diagnostics.noSignal') }}
    </div>
    <v-spacer />
  </v-overlay>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();
  const { showDiagnostics } = storeToRefs(store);
</script>

<style scoped>
  .no-signal {
    font-size: 24px;
    font-weight: bold;
    color: red;
  }
</style>
