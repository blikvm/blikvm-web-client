import { ref, computed } from 'vue';

export function useRecording(isRecording) {
  let mediaRecorder;
  let recordedChunks = [];
  let recordingTimer = null; // Timer for recording duration
  let recordingSeconds = ref(0); // Recording duration in seconds

  // Format time as 12h20m3s format
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h${m}m${s}s`;
  };

  // Computed formatted recording time
  const formattedRecordingTime = computed(() => formatTime(recordingSeconds.value));

  const startRecording = async () => {
    try {
      console.log('Start recording...');

      recordedChunks = [];
      const videoId = document.getElementById('webrtc-output');
      if (!videoId) {
        console.error('Video element not found');
        return;
      }
      const stream = videoId.captureStream();
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

      mediaRecorder.onstart = function () {
        isRecording.value = true;
        console.log('MediaRecorder started');

        // Start timer, update recording time every second
        recordingTimer = setInterval(() => {
          recordingSeconds.value++;
        }, 1000);
      };

      mediaRecorder.ondataavailable = function (event) {
        console.log('Data available event triggered');
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          console.log('Data chunk size:', event.data.size);
        } else {
          console.log('Data chunk empty');
        }
      };

      mediaRecorder.onstop = function () {
        console.log('Stopping media recorder...');

        // Create blob from recorded chunks
        const blob = new Blob(recordedChunks, { type: 'video/webm' });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Recording downloaded');
        isRecording.value = false;

        // Stop timer and reset
        clearInterval(recordingTimer);
        recordingTimer = null;
        recordingSeconds.value = 0;
        recordedChunks = [];
      };

      mediaRecorder.onerror = function (event) {
        console.error('MediaRecorder error:', event.error);
        isRecording.value = false;
        clearInterval(recordingTimer);
        recordingTimer = null;
        recordingSeconds.value = 0;
      };

      // Start recording
      mediaRecorder.start(1000); // Generate data chunk every second
      console.log('Media recorder started.');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    try {
      console.log('Stop recording...');
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        console.log('Media recorder stopped.');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const videoRecord = (isRecording) => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    recordingSeconds,
    formattedRecordingTime,
    startRecording,
    stopRecording,
    videoRecord,
  };
}
