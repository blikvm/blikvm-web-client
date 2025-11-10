<template>
  <!-- Unified single footer with toggle navigation -->
  <v-footer v-if="shouldShowFooter" class="d-flex flex-column pa-0 bg-black">
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
  import { computed, watch, onMounted, ref } from 'vue';
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
    // Business rules: mutual exclusions
    // 1. notifications vs (keyboard, console, serial)
    // 2. keyboard vs (console, serial)
    // 3. video is display-only, cannot be toggled by user
    // Rule: newest clicked component wins, hides all conflicting ones

    const interactiveComponents = ['keyboard', 'console', 'serial', 'notifications'];
    const newItem = newToggles.find((item) => !previousToggleState.value.includes(item));

    // If user clicked video, ignore it (video is controlled by video state, not user)
    if (newItem === 'video') {
      // Restore previous state - video toggle is display-only
      activeToggle.value = previousToggleState.value;
      return;
    }

    if (interactiveComponents.includes(newItem)) {
      // User clicked an interactive component, apply exclusions
      if (newItem === 'notifications') {
        // Notifications clicked - remove keyboard, console, serial
        newToggles = newToggles.filter((item) => !['keyboard', 'console', 'serial'].includes(item));
      } else if (newItem === 'keyboard') {
        // Keyboard clicked - remove notifications, console, serial
        newToggles = newToggles.filter(
          (item) => !['notifications', 'console', 'serial'].includes(item)
        );
      } else if (newItem === 'console' || newItem === 'serial') {
        // Terminal clicked - remove notifications and keyboard
        newToggles = newToggles.filter((item) => !['notifications', 'keyboard'].includes(item));
      }
    }

    // Update previous state for next time
    previousToggleState.value = [...newToggles];

    activeToggle.value = newToggles;
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

  // Component lifecycle
  onMounted(() => {
    if (typeof window !== 'undefined') {
      isTouchDevice.value =
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }
  });
</script>

<style scoped>
  /* Minimal styles for main AppFooter component */
</style>
