// Same binary HID RPC protocol as BliKVM Web. One reliable ordered channel
// keeps this example small; production clients may separate pointer motion.
export function keyUsage(code) {
  if (/^Key[A-Z]$/.test(code)) return code.charCodeAt(3) - 65 + 4;
  if (/^Digit[0-9]$/.test(code)) return code[5] === '0' ? 39 : 29 + Number(code[5]);
  if (/^F([1-9]|1[0-2])$/.test(code)) return 57 + Number(code.slice(1));
  return ({Enter:40,Escape:41,Backspace:42,Tab:43,Space:44,Minus:45,Equal:46,
    BracketLeft:47,BracketRight:48,Backslash:49,Semicolon:51,Quote:52,Backquote:53,
    Comma:54,Period:55,Slash:56,CapsLock:57,PrintScreen:70,ScrollLock:71,Pause:72,
    Insert:73,Home:74,PageUp:75,Delete:76,End:77,PageDown:78,ArrowRight:79,
    ArrowLeft:80,ArrowDown:81,ArrowUp:82,NumLock:83,NumpadDivide:84,
    NumpadMultiply:85,NumpadSubtract:86,NumpadAdd:87,NumpadEnter:88,
    Numpad1:89,Numpad2:90,Numpad3:91,Numpad4:92,Numpad5:93,Numpad6:94,
    Numpad7:95,Numpad8:96,Numpad9:97,Numpad0:98,NumpadDecimal:99,ContextMenu:101})[code];
}
const modifiers = {ControlLeft:0,ShiftLeft:1,AltLeft:2,MetaLeft:3,ControlRight:4,ShiftRight:5,AltRight:6,MetaRight:7};
export function keyboardReport(keys) {
  const packet = new Uint8Array(9); packet[0] = 2;
  const usages = [];
  for (const code of keys) {
    if (code in modifiers) packet[1] |= 1 << modifiers[code];
    else { const usage = keyUsage(code); if (usage) usages.push(usage); }
  }
  // USB boot keyboard: modifier byte, reserved byte, six usages.
  packet.set(usages.length > 6 ? [1,1,1,1,1,1] : usages, 3);
  return packet;
}
export function videoPoint(rect, width, height, x, y) {
  if (!width || !height || !rect.width || !rect.height) return null;
  const scale = Math.min(rect.width / width, rect.height / height);
  const w = width * scale, h = height * scale;
  const px = (x - rect.left - (rect.width-w)/2) / w;
  const py = (y - rect.top - (rect.height-h)/2) / h;
  return {x:Math.round(Math.max(0,Math.min(1,px))*32767),y:Math.round(Math.max(0,Math.min(1,py))*32767),inside:px>=0&&px<=1&&py>=0&&py<=1};
}
export function pointerReport(x, y, buttons) {
  const packet = new Uint8Array(10); packet[0] = 3;
  const data = new DataView(packet.buffer); data.setInt32(1,x,false); data.setInt32(5,y,false);
  packet[9] = buttons & 31; return packet;
}
export function bindHid(video, channel, enabled, onReady = () => {}) {
  let ready = false, buttons = 0, position = {x:0,y:0}; const keys = new Set();
  const listeners = [];
  const send = packet => { if (ready && channel.readyState === 'open') channel.send(packet); };
  const listen = (target, type, fn, options) => { target.addEventListener(type,fn,options); listeners.push(()=>target.removeEventListener(type,fn,options)); };
  const release = () => {
    const hadKeys=keys.size>0, hadButtons=buttons!==0;keys.clear();buttons=0;
    if(hadKeys)send(keyboardReport(keys));if(hadButtons)send(pointerReport(position.x,position.y,0));
  };
  const active = () => ready && enabled();
  listen(channel,'open',()=>channel.send(new Uint8Array([1,1])));
  listen(channel,'message',event=>{
    if (!(event.data instanceof ArrayBuffer)) return;
    const bytes=new Uint8Array(event.data);
    if(bytes.length===2&&bytes[0]===1&&bytes[1]===1){ready=true;onReady(true);}
  });
  listen(channel,'close',()=>{release();ready=false;onReady(false);});
  for(const type of ['keydown','keyup'])listen(video,type,event=>{
    if(!active()||event.isComposing)return;
    if(!(event.code in modifiers)&&!keyUsage(event.code))return;
    event.preventDefault();
    if(type==='keydown')keys.add(event.code);else keys.delete(event.code);
    send(keyboardReport(keys));
  });
  const point = event => videoPoint(video.getBoundingClientRect(),video.videoWidth,video.videoHeight,event.clientX,event.clientY);
  listen(video,'pointerdown',event=>{
    const p=point(event);if(!active()||!p?.inside)return;
    event.preventDefault();video.focus();video.setPointerCapture(event.pointerId);
    position=p;buttons=event.buttons;send(pointerReport(p.x,p.y,buttons));
  });
  for(const type of ['pointermove','pointerup'])listen(video,type,event=>{
    if(!active())return;const p=point(event);if(!p||(!p.inside&&!buttons))return;
    event.preventDefault();position=p;buttons=event.buttons;send(pointerReport(p.x,p.y,buttons));
  });
  listen(video,'wheel',event=>{
    if(!active()||!point(event)?.inside)return;event.preventDefault();
    send(new Uint8Array([4,(-Math.sign(event.deltaY))&255,Math.sign(event.deltaX)&255]));
  },{passive:false});
  listen(video,'contextmenu',event=>{if(active())event.preventDefault();});
  for(const type of ['blur','pointercancel','lostpointercapture'])listen(video,type,release);
  listen(window,'blur',release);
  listen(document,'visibilitychange',()=>{if(document.hidden)release();});
  return {release,dispose(){release();listeners.forEach(fn=>fn());ready=false;onReady(false);}};
}
