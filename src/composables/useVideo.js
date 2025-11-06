'use strict';

import Config from '@/config.js';
import Janus from '@/utils/janus.js';
import adapter from 'webrtc-adapter';
//
export function useVideo(device, streamElementRef) {
  const janus = ref(null);
  const wsProtocol = Config.http_protocol === 'https:' ? 'wss' : 'ws'; // TODO for testing
  const token = localStorage.getItem('token');

  const urlJanus = `${wsProtocol}://${Config.host_ip}${Config.host_port}/janus?token=${token}`;

  const uStreamerPluginHandle = ref(null);

  const initVideo = () => {
    const desp = { adapter };
    Janus.init({
      debug: false,
      dependencies: Janus.useDefaultDependencies(desp),
    });

    // TODO why would wsProtocol is derived?
    janus.value = new Janus({
      server: urlJanus,
      success: attachUStreamerPlugin,
      error: console.error,
    });
  };

  const attachUStreamerPlugin = () => {
    console.log('attach ustreamer plugin');
    janus.value.attach({
      plugin: 'janus.plugin.ustreamer',
      success: (pluginHandle) => {
        console.log('attach ustreamer plugin success');
        uStreamerPluginHandle.value = pluginHandle;
        uStreamerPluginHandle.value.send({
          message: { request: 'watch', params: { audio: true, video: true } },
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
          console.log('attach ustreamer jsepoffered');
          uStreamerPluginHandle.value.createAnswer({
            jsep: jsepOffer,
            media: { audioSend: false, videoSend: false }, // this is for microphone out and video out
            success: (jsepAnswer) => {
              console.log('attach ustreamer jsepanswered');
              uStreamerPluginHandle.value.send({
                message: { request: 'start' },
                jsep: jsepAnswer,
              });
              onVideoLoaded();
            },
            error: console.error,
          });
        }
      },
      onremotetrack: onRemoteTrack,
    });
  };

  const onRemoteTrack = (mediaStreamTrack, mediaId, isAdded) => {
    if (isAdded) {
      console.log('attach ustreamer rt added', mediaStreamTrack.id, mediaStreamTrack.kind);
      const videoElement = document.getElementById('webrtc-output');
      if (videoElement.srcObject === null) {
        videoElement.srcObject = new MediaStream();
      }
      videoElement.srcObject.addTrack(mediaStreamTrack.clone());
    }
  };

  const clearImageSource = () => {
    device.value.mjpegUrl = '';
  };

  const destroyJanusConnection = () => {
    const videoEl = streamElementRef?.value;
    if (janus.value) {
      janus.value.destroy();
      janus.value = null;
      console.log('Janus destroyed');
    }
    if (videoEl && videoEl.srcObject) {
      videoEl.srcObject.getTracks().forEach((track) => track.stop());
      videoEl.srcObject = null;
    }
  };

  const adjustVolume = (value) => {
    const videoElement = streamElementRef.value;
    if (videoElement) {
      videoElement.muted = false;
      const volume = Number(value);
      if (!isNaN(volume) && isFinite(volume)) {
        videoElement.volume = Math.min(Math.max(volume, 0), 1); // clamp between 0 and 1
      } else {
        console.warn('Invalid volume value:', value);
      }
    }
  };

  const onVideoLoaded = () => {
    console.log('onVideoLoaded');
  };

  async function captureAndDownloadImage(filename = 'screenshot.png') {
    const element = streamElementRef.value;
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
      element.crossOrigin = 'anonymous'; // 处理跨域问题
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

    // 创建一个下载链接模拟点击
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    initVideo,
    destroyJanusConnection,
    clearImageSource,
    adjustVolume,
    onVideoLoaded,
    captureAndDownloadImage,
  };
}
