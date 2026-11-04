# BliKVM WebRTC integration demo

English | [简体中文](README.zh-CN.md)

A small, dependency-free browser client for H.264 video, Opus audio and optional USB keyboard/mouse control. The page supports English and Simplified Chinese; switch languages without reconnecting. This replaces the legacy Vue/Janus client in this repository.

## Run

Serve the HTML and JavaScript files on the same HTTPS origin as the device API, or use Python 3's included loopback-only development proxy:

```sh
python3 serve.py --device DEVICE_IP --ca-cert /path/to/trusted-device.crt --port 10027
```

Open http://127.0.0.1:10027/ and sign in with your existing device account, then connect. Obtain the device certificate through a trusted channel; do not blindly trust one fetched from an unverified connection. The proxy verifies that certificate, binds only to 127.0.0.1 and is intended for development. Use same-origin HTTPS or an authenticated gateway in production. No credentials or certificates are included or stored in this repository. Do not open index.html with file://.

## API and protocol

- `POST /api/v1/auth/login`: HttpOnly session cookie. The simplified form does not implement 2FA; complete normal device login on the same origin for 2FA accounts.
- `OPTIONS /api/v1/stream/webrtc/signaling`: ICE configuration through Link headers.
- `GET /api/v1/stream/webrtc/signaling`: WebSocket upgrade. Send SDP offer with `data.codec: "h264"`, apply the answer and exchange ICE candidates. Buffer candidates until the remote SDP is ready. Send `ping` every 20 seconds. Video/audio use WebRTC tracks, not the signaling socket.
- One reliable, ordered `hidrpc` DataChannel: same binary report format as the built-in BliKVM Web client. Unlike the full client, this demo does not create additional unreliable pointer channels or API/terminal channels.

Receive permission is `kvm.view`; audio requires `audio.listen`, input requires `kvm.input`. Input is enabled only after the `[1,1]` HID handshake acknowledgement. Enable keyboard/mouse and focus the video to control the host. Losing focus, hiding the page, disabling input or disconnecting releases held keys/buttons. Audio starts muted; use Enable audio.

The mouse uses absolute coordinates (0..32767), excluding object-fit letterboxing. Configure the device for absolute or dual mouse mode. Keyboard reports contain modifiers plus six physical key usages; simultaneous Ctrl+A+S is supported. Browser/OS reserved shortcuts, IME text composition and clipboard pasting are outside this example.

## Files

- `index.html`, `app.js`, `i18n.js`: minimal bilingual UI.
- `receiver.js`: WebSocket signaling, media and connection lifetime.
- `hid.js`: physical key mapping, pointer reports and input cleanup.
- `serve.py`: optional local HTTPS/WebSocket upstream proxy.
- `hid.test.mjs`: combination keys, rollover, letterboxing, blur release and disposal tests.

```sh
node hid.test.mjs
python3 -m py_compile serve.py
```

Tested with RV1126B firmware 3.0.3 using Chrome-compatible browser WebRTC: 1920×1080 at approximately 60 fps, HID handshake, input event submission, disconnect and reconnect. Actual audible playback is not asserted by that test. Support for older firmware is not implied. Check device/browser H.264 capability before integrating.

The original repository license continues to apply; see LICENSE.
