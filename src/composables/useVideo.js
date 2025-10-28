'use strict';

import Config from '@/config.js';
import Janus from '@/utils/janus.js';
import adapter from 'webrtc-adapter';
import { useDevice } from '@/composables/useDevice';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { device } = useDevice();
const { audio } = storeToRefs(store);
//

// 单例实例
let videoSingleton = null;

export function useVideo() {
  if (videoSingleton) {
    return videoSingleton;
  }

  const janus = ref(null);
  const wsProtocol = Config.http_protocol === 'https:' ? 'wss' : 'ws';
  const token = localStorage.getItem('token');
  const urlJanus = `${wsProtocol}://${Config.host_ip}${Config.host_port}/janus?token=${token}`;
  const uStreamerPluginHandle = ref(null);
  let infoInterval = null;
  let frames = 0;

  const initMjpeg = () => {
    device.value.mjpegUrl = `${Config.http_protocol}//${Config.host_ip}${Config.host_port}/video/stream`;
  };

  const initVideo = () => {
    const desp = { adapter };
    Janus.init({
      debug: false,
      dependencies: Janus.useDefaultDependencies(desp),
    });
    janus.value = new Janus({
      server: urlJanus,
      success: attachUStreamerPlugin,
      error: console.error,
    });
  };

  const resetJanus = () => {
    destroyJanusConnection();
    initVideo();
  };

  const attachUStreamerPlugin = () => {
    console.log('attach ustreamer plugin');
    janus.value.attach({
      plugin: 'janus.plugin.ustreamer',
      success: (pluginHandle) => {
        console.log('attach ustreamer plugin success');
        uStreamerPluginHandle.value = pluginHandle;
        uStreamerPluginHandle.value.send({
          message: {
            request: 'watch',
            params: {
              audio: true,
              video: true,
              mic: audio.value.isMicrophoneOn,
            },
          },
        });
      },
      error: console.error,
      onmessage: (msg, jsepOffer) => {
        if (msg.error_code === 503) {
          console.log('attach ustreamer error code 503');
          uStreamerPluginHandle.value.send({ message: { request: 'watch' } });
          return;
        }

        if (jsepOffer) {
          // console.log('attach ustreamer jsepoffered sdp:', jsepOffer.sdp  );
          uStreamerPluginHandle.value.createAnswer({
            jsep: jsepOffer,
            media: { audioSend: audio.value.isMicrophoneOn, videoSend: false },
            stream: device.value.video.audioStream,
            success: (jsepAnswer) => {
              console.log('attach ustreamer createAnswer success sdp:', jsepAnswer.sdp);
              uStreamerPluginHandle.value.send({
                message: { request: 'start', params: { audio: true, video: true } },
                jsep: jsepAnswer,
              });
              onVideoLoaded();
            },
            error: console.error,
          });
        }
      },
      onremotetrack: onRemoteTrack,
      oncleanup: onCleanup,
    });
  };

  const seenRemoteTracks = new Set();
  const onRemoteTrack = (track, id, added) => {
    const key = `${id}:${track.kind}`;
    console.log('Got onRemoteTrack:', id, added, track, 'key:', key);
    if (added) {
      if (seenRemoteTracks.has(key)) return;
      const videoElement = document.getElementById('webrtc-output');
      if (videoElement.srcObject === null) {
        videoElement.srcObject = new MediaStream();
      }
      console.log('Adding track to remote stream:', track);
      videoElement.srcObject.addTrack(track);
      seenRemoteTracks.add(key);
      if (track.kind === 'video') {
        startInfoInterval();
      }
    }
  };

  const clearImageSource = () => {
    console.log('Clearing MJPEG image source');
    device.value.mjpegUrl = '';
    const videoEl = document.getElementById('mjpeg-output');
    if (videoEl && videoEl.src) {
      videoEl.src = '';
    }
  };

  const destroyJanusConnection = () => {
    stopInfoInterval();

    const videoEl = document.getElementById('webrtc-output');
    if (janus.value) {
      janus.value.destroy();
      janus.value = null;
      console.log('Janus destroyed');
    }
    if (videoEl && videoEl.srcObject) {
      videoEl.srcObject.getTracks().forEach((track) => track.stop());
      videoEl.srcObject = null;
    }
    seenRemoteTracks.clear();
  };

  const adjustVolume = (value) => {
    const videoElement = document.getElementById('webrtc-output');
    if (videoElement) {
      videoElement.muted = false;
      const volume = Number(value);
      if (!isNaN(volume) && isFinite(volume)) {
        videoElement.volume = Math.min(Math.max(volume, 0), 1);
      } else {
        console.warn('Invalid volume value:', value);
      }
    }
  };

  const onVideoLoaded = () => {
    console.log('onVideoLoaded');
  };

  const onCleanup = () => {
    console.log('Got a cleanup notification');
    stopInfoInterval();
  };

  const startInfoInterval = () => {
    stopInfoInterval();
    updateInfo();
    infoInterval = setInterval(updateInfo, 1000);
  };

  const stopInfoInterval = () => {
    if (infoInterval !== null) {
      clearInterval(infoInterval);
    }
    infoInterval = null;
  };

  const updateInfo = () => {
    if (uStreamerPluginHandle.value !== null) {
      const el = document.getElementById('webrtc-output');
      let currentFrames = null;
      if (el && el.webkitDecodedFrameCount !== undefined) {
        currentFrames = el.webkitDecodedFrameCount;
      } else if (el && el.mozPaintedFrames !== undefined) {
        currentFrames = el.mozPaintedFrames;
      }

      let bitrateKbps = null;
      if (typeof uStreamerPluginHandle.value.getBitrate === 'function') {
        const br = `${uStreamerPluginHandle.value.getBitrate()}`; // e.g. "1234 kbits/sec"
        const m = br.match(/([0-9]+(?:\.[0-9]+)?)/);
        if (m) {
          bitrateKbps = Number(m[1]);
        }
      }
      if (bitrateKbps !== null && !Number.isNaN(bitrateKbps)) {
        try {
          device.value.video.bitrate = Math.round(bitrateKbps);
        } catch (e) {
          // ignore assignment error, but keep UI info string updated
        }
      }
      if (currentFrames !== null) {
        const fpsDynamic = Math.max(0, currentFrames - frames);
        try {
          device.value.video.fps = fpsDynamic;
        } catch (e) {
          // ignore assignment error
        }
        frames = currentFrames;
      }
      // to do, how to show this info @ronan
      // console.log(info);
    }
  };

  async function captureAndDownloadImage(filename = 'screenshot.png') {
    const element = document.getElementById('webrtc-output');
    if (!element) {
      console.error('Element is null');
      return;
    }
    const canvas = document.createElement('canvas');
    let width, height;
    if (element instanceof HTMLVideoElement) {
      width = element.videoWidth;
      height = element.videoHeight;
    } else if (element instanceof HTMLImageElement) {
      if (!element.complete) {
        console.error('Image not fully loaded');
        return;
      }
      element.crossOrigin = 'anonymous';
      console.log('captureAndDownloadImage', element.naturalWidth, element.naturalHeight);
      width = element.naturalWidth;
      height = element.naturalHeight;
    } else {
      console.error('Unsupported element type:', element);
      return;
    }
    if (width === 0 || height === 0) {
      console.error('Element has no dimensions');
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(element, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  videoSingleton = {
    initMjpeg,
    initVideo,
    destroyJanusConnection,
    clearImageSource,
    adjustVolume,
    onVideoLoaded,
    captureAndDownloadImage,
    resetJanus,
  };

  return videoSingleton;
}
