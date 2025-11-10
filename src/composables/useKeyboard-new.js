'use strict';

// useKeyboard.js
import { ref, watch } from 'vue';
import { keytoCode } from '../utils/virtualKeyboard.js';
import { useDevice } from '@/composables/useDevice';
import { useAppStore } from '@/stores/stores';

const keyPress = ref('');
const pressedKeys = ref([]);
const { device } = useDevice();
let keyboardWatcherRegistered = false;
// AltGr fix (Windows): delay ControlLeft to detect AltGr (Ctrl+AltRight)
let altgrCtrlTimer = null;

// Helper to push a pressed key consistently
function pressKey(code) {
  if (!pressedKeys.value.includes(code)) {
    device.value.hid.keyboard.inputKey = code;
    keyPress.value = code;
    pressedKeys.value.push(code);
  }
}

// Encapsulated AltGr fix for Windows
// phase: 'down' | 'up'
// isWindows: boolean indicating if platform is Windows
// returns true if the handler consumed the event and caller should early-return
function handleAltGrFix(phase, code, isWindows) {
  if (!isWindows) return false;

  if (phase === 'down') {
    // Delay ControlLeft to detect AltGr (CtrlLeft + AltRight)
    if (code === 'ControlLeft') {
      if (!pressedKeys.value.includes('ControlLeft') && !altgrCtrlTimer) {
        altgrCtrlTimer = setTimeout(() => {
          altgrCtrlTimer = null;
          if (!pressedKeys.value.includes('ControlLeft')) {
            pressKey('ControlLeft');
          }
        }, 50);
        return true; // handled; caller should return early
      }
    }

    // If a pending ControlLeft timer exists and another key is pressed
    if (altgrCtrlTimer) {
      clearTimeout(altgrCtrlTimer);
      altgrCtrlTimer = null;
      // If it's not AltRight, treat it as real Ctrl usage: press ControlLeft now
      if (code !== 'AltRight' && !pressedKeys.value.includes('ControlLeft')) {
        pressKey('ControlLeft');
      }
      // If it IS AltRight, we are in AltGr: do NOT add ControlLeft here
    }
  } else if (phase === 'up') {
    // If ControlLeft was delayed and keyup happens before it was sent,
    // send a brief press so release makes sense (mirrors Pikvm fix)
    if (altgrCtrlTimer) {
      clearTimeout(altgrCtrlTimer);
      altgrCtrlTimer = null;
      if (!pressedKeys.value.includes('ControlLeft')) {
        pressKey('ControlLeft');
      }
    }
  }

  return false;
}

export function useKeyboard() {
  // Access store inside function to ensure platform detection has completed
  const appStore = useAppStore();

  const handlePressedKeysChange = (newVal) => {
    const obj = {
      k: newVal,
      ts: performance.now(),
    };
    if (device.value.ws && device.value.ws.readyState === WebSocket.OPEN) {
      try {
        //console.log('Sending pressed keys:', JSON.stringify(obj));
        device.value.ws.send(JSON.stringify(obj));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleKeyDown = (event) => {
    event.preventDefault();
    const code = event.code;

    // AltGr fix (Windows) – early-return if consumed
    if (handleAltGrFix('down', code, appStore.platform?.isWindows === true)) return;

    if (!pressedKeys.value.includes(code)) {
      device.value.hid.keyboard.keyPress = code;
      pressKey(code);
    }
    //console.log("down code:", code, "pressedKeys:", pressedKeys.value);
  };

  ///
  const handleKeyUp = (event) => {
    event.preventDefault();
    const code = event.code;

    // AltGr fix (Windows) – flush pending timer on keyup
    handleAltGrFix('up', code, appStore.platform?.isWindows === true); // no early-return needed
    const index = pressedKeys.value.indexOf(code);
    if (index > -1) {
      pressedKeys.value.splice(index, 1);
    } else {
      console.error('Key not found in pressedKeys:', code);
    }
    if (code === 'MetaLeft' || code === 'MetaRight') {
      while (pressedKeys.value.length > 0) {
        pressedKeys.value.pop();
      }
      return;
    }
    // console.log("up: code:", code, "pressedKeys:", pressedKeys.value);
  };

  // TODO this is not called?
  const handleKeyPress = (button) => {
    const keyCode = keytoCode(button);
    // console.log('pressed keyCode:', keyCode);
    if (!pressedKeys.value.includes(keyCode)) {
      device.value.hid.keyboard.keyPress = keyCode;
      pressedKeys.value.push(keyCode);
    }
  };

  // TODO this is not called?
  const handleKeyReleased = (button) => {
    const keyCode = keytoCode(button);
    // console.log('release keyCode:', keyCode);
    const index = pressedKeys.value.indexOf(keyCode);
    if (index > -1) {
      pressedKeys.value.splice(index, 1);
    } else {
      // Safety check: Silently handle keys that were pressed physically but not tracked
      // This is normal behavior when virtual keyboard tries to release keys that were pressed physically
    }
  };

  const releaseAllKey = () => {
    console.log('release all key len:', pressedKeys.value.length);
    while (pressedKeys.value.length > 0) {
      console.log('pressedKeys up:', pressedKeys.value);
      pressedKeys.value.pop();
    }
  };

  // 只注册一次监听，避免多个组件重复发送
  if (!keyboardWatcherRegistered) {
    watch(
      pressedKeys,
      (newVal) => {
        handlePressedKeysChange(newVal);
      },
      { deep: true }
    );
    keyboardWatcherRegistered = true;
  }

  return {
    keyPress,
    handleKeyPress,
    handleKeyReleased,
    handleKeyDown,
    handleKeyUp,
    releaseAllKey,
  };
}
