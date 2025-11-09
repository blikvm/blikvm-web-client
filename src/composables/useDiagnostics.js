'use strict';

import { useDevice } from '@/composables/useDevice';

const { device } = useDevice();

export function useDiagnostics() {
  const startDiagnosticsConnecting = () => {
    device.value.video.connectionState = 'connecting';
    if (device.value.video.connectingTimeout) {
      clearTimeout(device.value.video.connectingTimeout);
    }
    device.value.video.connectingTimeout = setTimeout(() => {
      if (device.value.video.connectionState === 'connecting') {
        console.log('DEBUG: Signal lost - connection timeout after 10 seconds');
        device.value.video.connectionState = 'no-signal';
      }
    }, 10000); // 10 seconds - reasonable wait time
  };

  return {
    startDiagnosticsConnecting,
  };
}
