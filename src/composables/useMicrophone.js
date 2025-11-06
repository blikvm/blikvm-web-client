// composables/useMicrophone.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { isMicrophoneOn } = storeToRefs(store);

export function useMicrophone(device) {
  //  const audioStream = ref(null);
  const error = ref(null);

  const turnOn = async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      device.value.video.audioStream = micStream;
      isMicrophoneOn.value = true;
      error.value = null;
      console.log('Microphone is on (via composable).');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      isMicrophoneOn.value = false;
      device.value.video.audioStream = null;
      error.value = err;
    }
  };

  const turnOff = () => {
    if (device.value.video.audioStream) {
      device.value.video.audioStream.getTracks().forEach((track) => track.stop());
      device.value.video.audioStream = null;
      isMicrophoneOn.value = false;
      console.log('Microphone is off (via composable).');
    }
  };

  // Automatically turn off the microphone when the component using this composable is unmounted
  onUnmounted(turnOff);

  return {
    // audioStream,
    error,
    turnOnMic: turnOn,
    turnOffMic: turnOff,
  };
}
