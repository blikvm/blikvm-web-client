import { computed } from 'vue';

/**
 * Composable for managing keyboard lock states
 * Provides reactive state for Caps Lock, Num Lock, and Scroll Lock
 */
export function useLockStates(device) {
  /**
   * Computed property for keyboard lock states
   * @returns {Array} Array of lock state objects with name and active status
   */
  const lockStates = computed(() => [
    { name: 'Caps', active: device.value.hid.keyboard.isCapsLock },
    { name: 'Num', active: device.value.hid.keyboard.isNumLock },
    { name: 'Scroll', active: device.value.hid.keyboard.isScrollLock }
  ]);

  return {
    lockStates,
  };
}
