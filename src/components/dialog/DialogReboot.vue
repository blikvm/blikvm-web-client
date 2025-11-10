<template>
  <v-dialog v-model="showRebootDialog" max-width="500">
    <v-card>
      <v-card-title class="text-h5">
        <v-icon color="warning" class="mr-2"> mdi-alert </v-icon>
        {{ $t('settings.device.systemControl.confirmTitle') }}
      </v-card-title>
      <v-card-text>
        <p>{{ $t('settings.device.systemControl.confirmMessage') }}</p>
        <v-alert type="warning" variant="tonal" density="compact" class="mt-3">
          {{ $t('settings.device.systemControl.confirmWarning') }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="isRebooting" @click="showRebootDialog = false">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="error" variant="flat" :loading="isRebooting" @click="handleReboot">
          {{ $t('settings.device.systemControl.confirmButton') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref } from 'vue';
  import { useAlert } from '@/composables/useAlert';
  import http from '@/utils/http.js';

  const { sendAlert } = useAlert();

  // Reboot dialog state
  const showRebootDialog = ref(false);
  const isRebooting = ref(false);

  // Expose method to open dialog
  const open = () => {
    showRebootDialog.value = true;
  };

  defineExpose({
    open,
  });

  const handleReboot = async () => {
    isRebooting.value = true;

    try {
      // Show initial message
      const title = 'System Reboot';
      const message = 'Initiating KVM device reboot...';
      sendAlert('info', title, message);

      // Call reboot API endpoint
      const response = await http.post('/reboot');

      if (response.status === 200 && response.data.code === 0) {
        // Success - show rebooting message
        sendAlert(
          'success',
          'System Reboot',
          'KVM device is rebooting. The connection will be lost temporarily.'
        );

        // Close dialog
        showRebootDialog.value = false;

        // Show reconnection status after delay
        setTimeout(() => {
          sendAlert('info', 'System Status', 'Waiting for KVM device to come back online...');
          // The existing WebSocket reconnection logic should handle reconnection
        }, 5000);
      } else {
        // API returned error
        const errorTitle = 'Reboot Failed';
        const errorMessage = response.data.msg || 'Failed to initiate reboot';
        sendAlert('error', errorTitle, errorMessage);
      }
    } catch (error) {
      // Network error or timeout
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // This might actually mean the reboot started successfully
        sendAlert(
          'warning',
          'System Reboot',
          'Reboot command sent. Connection lost - this is expected during reboot.'
        );
        showRebootDialog.value = false;

        setTimeout(() => {
          sendAlert('info', 'System Status', 'Waiting for KVM device to reconnect...');
        }, 3000);
      } else {
        // Actual error
        const errorTitle = 'Reboot Error';
        const errorMessage = error.message || 'Failed to reboot KVM device';
        sendAlert('error', errorTitle, errorMessage);
      }
    } finally {
      // Reset loading state after a delay
      setTimeout(() => {
        isRebooting.value = false;
      }, 30000); // Reset after 30 seconds
    }
  };
</script>

<style scoped></style>
