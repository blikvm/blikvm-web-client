<template>
  <!-- Unified single footer with toggle navigation -->
  <v-footer
    v-if="shouldShowFooter"
    class="d-flex flex-column pa-0 bg-black"
  >
    <!-- Content sections with proper ordering: Virtual Mouse → Notifications → Terminals → Keyboard -->
    <div v-if="hasActiveComponents">
      <!-- Virtual Mouse Section -->
      <AppFooterVirtualMouse :show-virtual-mouse="showVirtualMouse" />

      <!-- Notifications Section -->
      <AppFooterNotifications :show-notifications="showNotifications" />

      <!-- Terminal Section -->
      <AppFooterTerminals
        :show-s-s-h-terminal="showSSHTerminal"
        :show-serial="showSerial"
        :settings="settings"
      />

      <!-- Desktop Keyboard Section -->
      <AppFooterDesktopKeyboard
        :show-keyboard="showKeyboard"
        :is-experimental="isExperimental"
        :device="device"
        :handle-key-press="handleKeyPress"
        :handle-key-released="handleKeyReleased"
      />
    </div>

    <!-- Navigation bar -->
    <AppFooterNavigation
      :footer="footer"
      :active-toggle="activeToggle"
      :device="device"
      :lock-states="lockStates"
      :is-touch-device="isTouchDevice"
      :handle-toggle-change="handleToggleChange"
    />
  </v-footer>
</template>

<script setup>
  import { computed, watch, onMounted, onBeforeUnmount, ref } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useKeyboard } from '@/composables/useKeyboard-new';
  import { useFooterToggle } from '@/composables/useFooterToggle';
  import { useComponentVisibility } from '@/composables/useComponentVisibility';
  import { useLockStates } from '@/composables/useLockStates';

  // Component imports
  import AppFooterVirtualMouse from '@/components/footer/AppFooterVirtualMouse.vue';
  import AppFooterNotifications from '@/components/footer/AppFooterNotifications.vue';
  import AppFooterTerminals from '@/components/footer/AppFooterTerminals.vue';
  import AppFooterDesktopKeyboard from '@/components/footer/AppFooterDesktopKeyboard.vue';
  import AppFooterNavigation from '@/components/footer/AppFooterNavigation.vue';

  // Composables and stores
  const store = useAppStore();
  const { device } = useDevice();
  const { isExperimental, footer, isTouchDevice, settings } = storeToRefs(store);
  const { handleKeyPress, handleKeyReleased } = useKeyboard(device.value.ws);

  // Footer toggle functionality with proper mutual exclusivity - video always active
  const { activeToggle, handleToggleChange: handleFooterToggleChange } = useFooterToggle(['video']);

  // Business logic composables
  const { lockStates } = useLockStates(device);

  // Store previous state to detect changes
  const previousToggleState = ref([...activeToggle.value]);

  // Component visibility management with business rules
  const {
    showKeyboard,
    showMobileKeyboard,
    showVirtualMouse,
    showSerial,
    showNotifications,
    updateVisibility,
    watchToggleChanges,
  } = useComponentVisibility(device, isTouchDevice);

  // Computed properties
  const showSSHTerminal = computed(() => device.value.showSSHTerminal);

  const hasActiveComponents = computed(
    () =>
      showKeyboard.value ||
      showMobileKeyboard.value ||
      showVirtualMouse.value ||
      showSSHTerminal.value ||
      showSerial.value ||
      showNotifications.value
  );

  const shouldShowFooter = computed(() => footer.value.showFooter);

  function handleToggleChange(newToggles) {
    // If user clicked video, ignore it (video is controlled by video state, not user)
    const newItem = newToggles.find(item => !previousToggleState.value.includes(item));
    if (newItem === 'video') {
      // Restore previous state - video toggle is display-only
      activeToggle.value = previousToggleState.value;
      return;
    }
    
    // Update previous state for next time
    previousToggleState.value = [...newToggles];
    
    // Let useFooterToggle handle the mutual exclusion logic
    handleFooterToggleChange(newToggles);
    updateVisibility(newToggles);
  }

  // State synchronization with device store
  watch(
    () => device.value.showSSHTerminal,
    (newValue) => {
      // Sync the SSH terminal state with the toggle
      const currentToggle = [...activeToggle.value];
      const hasConsole = currentToggle.includes('console');

      if (newValue && !hasConsole) {
        activeToggle.value = [...currentToggle, 'console'];
      } else if (!newValue && hasConsole) {
        activeToggle.value = currentToggle.filter((item) => item !== 'console');
      }
    },
    { immediate: true }
  );

  // Ensure video is always in the toggle (read-only/always active)
  watch(
    activeToggle,
    (newToggle) => {
      if (!newToggle.includes('video')) {
        activeToggle.value = [...newToggle, 'video'];
      }
    },
    { immediate: true }
  );

  // Setup component visibility watcher
  watchToggleChanges(activeToggle);

  // Enhanced touch detection for USB touch screens
  const detectTouchDevice = () => {
    // Standard touch detection
    const hasOntouchstart = 'ontouchstart' in window;
    const hasMaxTouchPoints = navigator.maxTouchPoints > 0;
    const hasMsMaxTouchPoints = navigator.msMaxTouchPoints > 0;
    
    // Additional detection for USB touch screens
    const hasPointerEvents = 'onpointerdown' in window;
    const hasTouchEvents = 'TouchEvent' in window;
    
    // Check media queries for touch capability
    const hasTouchMediaQuery = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    
    // More precise touch detection - only consider actual touch capability
    const isTouch = hasOntouchstart || hasMaxTouchPoints || hasMsMaxTouchPoints || 
                   hasTouchMediaQuery;
    
    // Touch detection logic - using multiple detection methods for accuracy
    
    return isTouch;
  };

  // Re-check when USB devices are connected/disconnected
  const recheckTouchDevice = () => {
    const newValue = detectTouchDevice();
    if (newValue !== isTouchDevice.value) {
      isTouchDevice.value = newValue;
    }
  };

// Component lifecycle
onMounted(() => {
  if (typeof window !== 'undefined') {
    isTouchDevice.value = detectTouchDevice();
    
    // Global debug function for manual override
    window.setTouchDevice = (value) => {
      isTouchDevice.value = value;
    };
    window.getTouchDeviceStatus = () => {
      return { current: isTouchDevice.value, detected: detectTouchDevice() };
    };
    
    // Listen for device changes (when USB devices are plugged/unplugged)
    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', recheckTouchDevice);
    }
  }
});

onBeforeUnmount(() => {
  if (navigator.mediaDevices) {
    navigator.mediaDevices.removeEventListener('devicechange', recheckTouchDevice);
  }
});
</script>

<style scoped>
/* Minimal styles for main AppFooter component */
</style>
