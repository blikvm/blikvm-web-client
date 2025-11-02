// useDevice.js
import { computed } from 'vue';
import { useAppStore } from '@/stores/stores';

export function useDevice() {
  const store = useAppStore();

  const device = computed(() => {
    const foundDevice = store.devices; // Find the device by id
    return foundDevice; // Return the found device or undefined if not found
  });

  // Computed property to check if the board supports audio/mic features
  const supportsAudioFeatures = computed(() => {
    return device.value?.board?.type === '4B' || device.value?.board?.type === 'CM4';
  });

  return { device, supportsAudioFeatures };
}
