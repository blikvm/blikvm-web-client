import { computed } from 'vue';
import http from '@/utils/http.js';
import { useDiagnostics } from '@/composables/useDiagnostics';
import { useI18n } from 'vue-i18n';

export function useATX(device) {
  const { startDiagnosticsConnecting } = useDiagnostics();
  const { t } = useI18n();

  const triggerPowerButton = async (button) => {
    try {
      startDiagnosticsConnecting();
      const response = await http.post(`/atx/click?button=${button}`);
      console.log(response.data);
      // return response.data;
    } catch (error) {
      console.error('Error during atx button trigger:', error);
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