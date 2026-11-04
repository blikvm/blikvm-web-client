import {bindHid} from './hid.js';
export async function receiveKvm(video, iceServers = [], onStatus = () => {}, input = {}) {
  const url = new URL('/api/v1/stream/webrtc/signaling', location.href);
  url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const pc = new RTCPeerConnection({ iceServers });
  const ws = new WebSocket(url);
  const media = new MediaStream();
  const pending = [];
  let heartbeat;
  let statsTimer;
  let startup;
  let messages = Promise.resolve();
  let stopped = false;
  const hid = bindHid(video, pc.createDataChannel('hidrpc', {ordered:true}), input.enabled || (()=>false), input.onReady);
  input.onRelease?.(hid.release);
  const stop = () => {
    if (stopped) return;
    hid.dispose();
    stopped = true;
    clearInterval(heartbeat);
    clearInterval(statsTimer);
    clearTimeout(startup);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'close' }));
    }
    ws.close();
    pc.close();
    video.srcObject = null;
  };
  try {
    video.muted = true;
    video.autoplay = true;
    video.srcObject = media;
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.ontrack = ({ track, streams }) => {
      if (track.kind === 'video' && track.id !== 'main-video' &&
          !streams.some(stream => stream.id === 'blikvm-main')) return;
      media.addTrack(track);
      if (track.kind === 'video') clearTimeout(startup);
    };
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'new-ice-candidate', data: candidate.toJSON() }));
      }
    };
    pc.onconnectionstatechange = () => {
      onStatus(pc.connectionState);
      if (pc.connectionState === 'failed') stop();
    };
    ws.onmessage = ({ data }) => {
      messages = messages.then(async () => {
        if (stopped || data === 'pong') return;
        const message = JSON.parse(data);
        if (message.type === 'answer') {
          await pc.setRemoteDescription({ type: 'answer', sdp: message.data.sdp });
          while (pending.length) await pc.addIceCandidate(pending.shift());
        } else if (message.type === 'candidate' || message.type === 'new-ice-candidate') {
          if (pc.remoteDescription) await pc.addIceCandidate(message.data);
          else pending.push(message.data);
        } else if (message.type === 'error') {
          throw new Error(message.data);
        }
      }).catch(error => { console.error(error); stop(); });
    };
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Signaling connection timeout')), 8000);
      ws.onopen = () => { clearTimeout(timeout); resolve(); };
      ws.onerror = () => { clearTimeout(timeout); reject(new Error('Signaling connection failed')); stop(); };
      ws.onclose = () => { clearTimeout(timeout); if (!stopped) onStatus('Signaling disconnected'); reject(new Error('Signaling connection closed')); stop(); };
    });
    heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send('ping');
    }, 20000);
    startup = setTimeout(() => { onStatus('Timed out: no media track'); stop(); }, 20000);
    await pc.setLocalDescription(await pc.createOffer());
    ws.send(JSON.stringify({ type: 'offer', data: { sdp: pc.localDescription.sdp, codec: 'h264' } }));
    statsTimer = setInterval(async () => {
      try {
        for (const s of (await pc.getStats()).values()) {
          if (s.type === 'inbound-rtp' && s.kind === 'video') {
            onStatus(`${pc.connectionState} · ${s.frameWidth || video.videoWidth}×${s.frameHeight || video.videoHeight} · ${s.framesPerSecond || 0} fps · decoded ${s.framesDecoded || 0} frames`);
          }
        }
      } catch { /* peer may have closed */ }
    }, 1000);
    return stop;
  } catch (error) {
    stop();
    throw error;
  }
}