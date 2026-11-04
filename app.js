import {t, statusText, applyLanguage} from './i18n.js';

import {receiveKvm} from './receiver.js';
const status=document.querySelector('#status'),video=document.querySelector('video'),connect=document.querySelector('#connect'),stop=document.querySelector('#stop');let cleanup=null, releaseKeys=()=>{};
const input=document.querySelector('#input'),hidStatus=document.querySelector('#hid-status');
input.onchange=()=>{releaseKeys();if(input.checked)video.focus();};
document.querySelector('#sound').onchange=e=>{video.muted=!e.target.checked;};
let currentStatus='idle';
const show=s=>{currentStatus=s;status.textContent=statusText(t(s));};
document.querySelector('#language').onchange=e=>{applyLanguage(e.target.value);show(currentStatus);};
applyLanguage();show('idle');
document.querySelector('#login').onsubmit=async e=>{e.preventDefault();try{const body=Object.fromEntries(new FormData(e.target));const r=await fetch('/api/v1/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin'});e.target.password.value='';const data=await r.json();if(!r.ok||!data.ok)throw new Error(t('loginError'));show('signedIn');}catch(e){show(e.message);}};
stop.onclick=()=>{cleanup?.();cleanup=null;connect.disabled=false;stop.disabled=true;show('disconnected');};
connect.onclick=async()=>{connect.disabled=true;stop.disabled=true;show('connecting');try{
const config=await fetch('/api/v1/stream/webrtc/signaling',{method:'OPTIONS',credentials:'same-origin'});if(!config.ok)throw new Error(t('permission',{code:config.status}));
const iceServers=[];const links=config.headers.get('Link')||'';
for(const m of links.matchAll(/<([^>]+)>\s*;\s*rel="ice-server"(?:\s*;\s*username="((?:\\.|[^"\\])*)"\s*;\s*credential="((?:\\.|[^"\\])*)"\s*;\s*credential-type="password")?/g)){const s={urls:m[1]};if(m[2]!==undefined){s.username=JSON.parse('"'+m[2]+'"');s.credential=JSON.parse('"'+m[3]+'"');}iceServers.push(s);}
const release=await receiveKvm(video,iceServers,s=>{show(s);if(s==='failed'||s.startsWith('Timed out')||s==='Signaling disconnected'){connect.disabled=false;stop.disabled=true;}}, {enabled:()=>input.checked,onReady:ready=>{input.disabled=!ready;hidStatus.dataset.i18n=ready?'hidReady':'hidOff';hidStatus.textContent=t(hidStatus.dataset.i18n);if(!ready)input.checked=false;},onRelease:fn=>{releaseKeys=fn;}});cleanup=release;stop.disabled=false;
}catch(e){cleanup?.();cleanup=null;connect.disabled=false;stop.disabled=true;show(e.message);}};
addEventListener('pagehide',()=>cleanup?.());
