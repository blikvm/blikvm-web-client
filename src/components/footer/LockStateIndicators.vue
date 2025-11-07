<template>
  <!-- Lock state indicators (desktop only) -->
  <template v-if="!isTouchDevice">
    <!-- Current key press indicator -->
    <v-chip
      v-if="device.hid.keyboard.keyPress"
      grow
      color="#76FF03"
      :ripple="false"
      v-tooltip:top="$t('common.keypress')"
      class="align-center cursor-default"
      @click.stop
    >
      {{ device.hid.keyboard.keyPress }}
    </v-chip>

    <!-- Lock state indicators -->
    <v-chip
      v-for="lock in lockStates"
      :key="lock.name"
      :disabled="!lock.active"
      :color="lock.active ? '#76FF03' : ''"
    >
      {{ lock.name }}
    </v-chip>
  </template>
</template>

<script setup>
import { onMounted } from 'vue';
import { useI18n } from "vue-i18n";

// Props
const props = defineProps({
  device: {
    type: Object,
    required: true
  },
  lockStates: {
    type: Array,
    required: true
  },
  isTouchDevice: {
    type: Boolean,
    required: true
  }
});

// Composables
const { t } = useI18n();

// Debug logging for mobile state
onMounted(() => {
  console.log('DEBUG LockStateIndicators - isTouchDevice:', props.isTouchDevice);
  console.log('DEBUG LockStateIndicators - will show lock indicators:', !props.isTouchDevice);
});
</script>

<style scoped>
.cursor-default {
  cursor: default;
}
</style>