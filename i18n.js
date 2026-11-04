const messages = {
  "title": [
    "BliKVM WebRTC Demo",
    "BliKVM WebRTC 示例"
  ],
  "intro": [
    "H.264 video and audio with optional keyboard and mouse control. Audio starts muted.",
    "H.264 画面与声音，可选键盘鼠标控制，声音默认静音。"
  ],
  "user": [
    "Username",
    "用户名"
  ],
  "password": [
    "Password",
    "密码"
  ],
  "login": [
    "Sign in",
    "登录"
  ],
  "session": [
    "Already signed in on this origin? Connect directly. For two-factor accounts, sign in using the device’s normal login page first.",
    "已有同源登录会话时可直接连接。启用二次验证的账号，请先在设备登录页完成验证。"
  ],
  "connect": [
    "Connect",
    "连接视频"
  ],
  "stop": [
    "Disconnect",
    "断开"
  ],
  "input": [
    "Enable keyboard & mouse",
    "启用键鼠"
  ],
  "sound": [
    "Enable audio",
    "开启声音"
  ],
  "hidReady": [
    "Keyboard & mouse ready",
    "键鼠就绪"
  ],
  "hidOff": [
    "Keyboard & mouse disconnected",
    "键鼠未连接"
  ],
  "idle": [
    "Not connected",
    "未连接"
  ],
  "connecting": [
    "Connecting…",
    "正在连接…"
  ],
  "signedIn": [
    "Signed in. Ready to connect.",
    "已登录，可以连接视频"
  ],
  "disconnected": [
    "Disconnected",
    "已断开"
  ],
  "loginError": [
    "Sign-in failed. Check your credentials or complete two-factor authentication on the device.",
    "登录失败，请核对账号或先在设备页面完成二次验证。"
  ],
  "permission": [
    "Authentication / permission check failed: HTTP {code}. Sign in first.",
    "鉴权／权限检查失败：HTTP {code}，请先登录。"
  ],
  "videoLabel": [
    "Remote screen. Enable keyboard and mouse, then click to control.",
    "远端画面，启用键鼠后可点击控制"
  ],
  "help": [
    "Enable keyboard and mouse, then click the screen to control. Leaving the screen releases held keys. Physical key codes are supported; IME text composition and browser-reserved shortcuts are outside this example.",
    "启用键鼠后点击画面控制；离开画面自动释放按键。支持物理键码；输入法组合文本和浏览器保留快捷键不在此示例范围内。"
  ],
  "signal": [
    "Signaling",
    "信令"
  ],
  "origin": [
    "Serve this page on the device API origin, or use the included local proxy.",
    "页面须与设备 API 同源，或通过附带的本地代理运行。"
  ],
  "connected": [
    "Connected",
    "已连接"
  ],
  "failed": [
    "Connection failed",
    "连接失败"
  ],
  "closed": [
    "Closed",
    "已关闭"
  ],
  "new": [
    "New connection",
    "新连接"
  ],
  "checking": [
    "Checking connectivity",
    "正在检查连接"
  ],
  "completed": [
    "Connected",
    "已连接"
  ],
  "Signaling disconnected": [
    "Signaling disconnected",
    "信令已断开"
  ],
  "Timed out: no media track": [
    "Timed out: no media track",
    "等待媒体轨道超时"
  ],
  "Signaling connection timeout": [
    "Signaling connection timeout",
    "信令连接超时"
  ],
  "Signaling connection failed": [
    "Signaling connection failed",
    "信令连接失败"
  ],
  "Signaling connection closed": [
    "Signaling connection closed",
    "信令连接已关闭"
  ],
  "decoded": [
    "decoded",
    "已解码"
  ],
  "frames": [
    "frames",
    "帧"
  ]
};
let language;
try { language = localStorage.getItem('blikvm-demo-language'); } catch {}
if (!['en','zh-CN'].includes(language)) language = navigator.language.startsWith('zh') ? 'zh-CN' : 'en';
export function t(key, values = {}) {
  let text = messages[key]?.[language === 'zh-CN' ? 1 : 0] || key;
  for (const [k,v] of Object.entries(values)) text = text.replaceAll('{'+k+'}',v);
  return text;
}
export function statusText(value) {
  return value.split(' · ').map(part => messages[part] ? t(part) : part.replace('decoded ',t('decoded')+' ').replace(' frames',' '+t('frames'))).join(' · ');
}
export function applyLanguage(next = language) {
  language = next; document.documentElement.lang = language;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(el => {el.textContent = t(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-label]').forEach(el => el.setAttribute('aria-label',t(el.dataset.i18nLabel)));
  document.querySelector('#language').value = language;
  try { localStorage.setItem('blikvm-demo-language',language); } catch {}
}
