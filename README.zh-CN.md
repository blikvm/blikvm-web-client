[English](README.md) | 简体中文

# BliKVM WebRTC 接收 Demo

无 npm 依赖。index.html 是示例界面，receiver.js 是接收端模块，hid.js 是键盘鼠标模块。

## 运行

方式一：将 index.html、receiver.js、hid.js 放在与设备 API 同源的 HTTPS 静态目录，在设备正常登录后打开。所有 API 路径相对于页面所在 origin。

方式二：使用附带的 Python 3 本地代理（仅监听 127.0.0.1）：

```sh
python3 serve.py --device 192.168.8.171 --ca-cert /path/to/trusted-device.crt --port 10027
```

浏览器打开 http://127.0.0.1:10027/ ，输入设备现有账号密码登录，然后点击“连接视频”。trusted-device.crt 必须通过可信渠道从自己的设备取得，不能盲信网络下载的证书。本代理只用于开发验证，生产环境请使用同源 HTTPS 或正式认证网关。代理使用证书验证，不启用未经验证的 TLS。

## 集成流程

1. 登录获得 HttpOnly 会话 Cookie；浏览器 WebSocket 无法自定义 Authorization 头。服务端集成可在 WebSocket 握手携带 Bearer API Token。勿在 URL 放令牌。
2. OPTIONS /api/v1/stream/webrtc/signaling 读取 Link 头的 STUN/TURN 配置。
3. 创建 RTCPeerConnection，注册 recvonly 视频/音频 transceiver。
4. 打开同源 WebSocket，发送 offer，data.codec 明确使用 h264。接收 answer 并交换 ICE，候选需等待远端 SDP 后应用。
5. 在 ontrack 中接收主视频 main-video / blikvm-main。WebSocket 只承载信令；媒体通过 WebRTC 传输。
6. 每 20 秒发送 ping 保活；关闭 WebSocket 与 PeerConnection，清理计时器及播放器。重连创建新会话。

视频需要 kvm.view，音频需要 audio.listen；示例创建一个可靠有序的 hidrpc DataChannel。勾选“启用键鼠”并点击画面后即可操作，需要 kvm.input 权限。收到 [1,1] 协议握手确认后才允许启用。鼠标示例使用绝对坐标，设备鼠标模式应为 absolute 或 dual；画面黑边不参与坐标映射。自动播放默认静音，勾选“开启声音”解除静音。仅支持设备和浏览器共同支持的 H.264；通过 /api/v1/capabilities 查询硬件能力。页面不要直接用 file:// 打开，也不要从任意第三方站点直接跨域调用设备。

此包不含设备证书、账号密码、令牌或录制的客户画面。双因素账号应先在同源的正常登录页面完成验证；该简化登录表单不覆盖 2FA 流程。

## 键鼠报文（与自带 Web 相同）

- `01 01`：HID 协议握手；服务端返回相同两字节。
- `02 + 8字节HID键盘报告`：modifier、reserved、六个键码。使用 KeyboardEvent.code，支持 Ctrl+A+S 等同时按键，超过六个普通键发送 USB rollover。
- `03 + int32BE X + int32BE Y + buttons`：绝对鼠标，X/Y 为 0..32767。坐标按 object-fit:contain 的实际画面计算。
- `04 + int8 wheelY + int8 wheelX`：滚轮。

为保持示例简单，所有报文走同一个可靠有序通道；自带 Web 为高频鼠标移动另开不可靠通道，二进制报文格式相同。失焦、隐藏页面、关闭控制和断开会释放按键。视频区以外的本地登录输入不会转发给目标电脑。

输入只支持物理键码；浏览器/操作系统保留的快捷键可能被本机截获，中文 IME 组合文本与剪贴板粘贴不属于本示例。运行 `node hid.test.mjs` 可验证组合键、释放和坐标映射。
