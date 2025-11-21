import { computed } from 'vue';
import http from '@/utils/http.js';
import { useDiagnostics } from '@/composables/useDiagnostics';
import { useI18n } from 'vue-i18n';

export function useATX(device) {
  // Toggle between legacy RPC and new REST API
  const useRestAPI = false; // Change to true to use new REST API (/api/v1/atx/power)
  const { startDiagnosticsConnecting } = useDiagnostics();
  const { t } = useI18n();

  // Legacy RPC API function
  const triggerPowerButtonLegacy = async (button) => {
    try {
      startDiagnosticsConnecting();
      const response = await http.post(`/atx/click?button=${button}`);
      console.log('Legacy ATX API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during legacy ATX button trigger:', error);
      throw error;
    }
  };

  // New REST API function
  const triggerPowerButtonRest = async (button) => {
    try {
      startDiagnosticsConnecting();
      
      // Map legacy actions to new REST actions
      const actionMap = {
        'power': 'on',
        'forcepower': 'off',
        'reboot': 'reset'
      };
      
      const action = actionMap[button] || button;
      const response = await http.put('/api/v1/atx/power', { action });
      console.log('REST ATX API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during REST ATX power control:', error);
      throw error;
    }
  };

  // Main function that chooses API version
  const triggerPowerButton = async (button) => {
    if (useRestAPI) {
      return await triggerPowerButtonRest(button);
    } else {
      return await triggerPowerButtonLegacy(button);
    }
  };

  const atxItems = computed(() => {
    if (!device.value) return [];
    return [
      {
        icon: 'mdi-power',
        color: device.value.health.isPowerLedActive ? 'primary' : 'error',
        title: t('settings.atx.powerOn'),
        action: 'power',
      },
      {
        icon: 'mdi-power-sleep',
        color: device.value.health.isPowerLedActive ? 'primary' : 'error',
        title: t('settings.atx.powerOff'),
        action: 'power',
      },
      {
        icon: 'mdi-power-off',
        color: device.value.health.isPowerLedActive ? 'primary' : 'error',
        title: t('settings.atx.forceOff'),
        action: 'forcepower',
      },
      {
        icon: 'mdi-restart',
        color: device.value.health.isPowerLedActive ? 'primary' : 'error',
        title: t('settings.atx.reset'),
        action: 'reboot',
      },
    ];
  });

  return {
    triggerPowerButton,
    atxItems,
  };
}
