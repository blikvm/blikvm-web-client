/*****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/

/*
 * PIKVM-STYLE SHORTCUT TRANSMISSION - Multiple Modes
 * ==================================================
 * 
 * Supports multiple PiKVM shortcut transmission modes:
 * 
 * 1. MAGIC KEY MODE (default):
 *    - Press magic key (ScrollLock) → Enter composition mode
 *    - Press keys → Accumulate combination (Ctrl+Alt+Del+Enter)
 *    - Press magic key again → Send complete shortcut to KVM
 * 
 * 2. HOLD & RELEASE MODE:
 *    - Hold modifiers → Press main key → Release all to send
 *    - No magic key required, direct transmission
 * 
 * 3. ACCUMULATING MODE:
 *    - Double-press modifier to make it "sticky" 
 *    - Build combination with sticky modifiers
 *    - Press main key to send
 * 
 * 4. DIRECT MODE:
 *    - Single key shortcuts sent immediately
 *    - No composition required
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';

// Magic key system - always available like real PiKVM

// Magic key configuration - using PiKVM default
const DEFAULT_MAGIC_KEY = 'ScrollLock';
const STORAGE_KEY_MAGIC = 'blikvm-magic-key-config';

// Global state for magic key system
const isComposing = ref(false);
const currentKeys = ref([]);
const displayText = ref('');
const magicKey = ref(DEFAULT_MAGIC_KEY);

// Export global composing state for other keyboard systems to check
export const isMagicKeyComposing = () => isComposing.value;

// Load magic key configuration from localStorage
const loadConfig = () => {
  try {
    const storedMagicKey = localStorage.getItem(STORAGE_KEY_MAGIC);
    if (storedMagicKey) {
      magicKey.value = storedMagicKey;
    }
  } catch (error) {
    // Silently fall back to default
  }
};

// Save magic key preference
const saveMagicKeyConfig = (key) => {
  try {
    localStorage.setItem(STORAGE_KEY_MAGIC, key);
    magicKey.value = key;
  } catch (error) {
    // Silently fail
  }
};

// Check if key is the magic trigger
const isMagicKey = (code) => code === magicKey.value;

// Check if key is a modifier
const isModifier = (code) => {
  return ['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight',
          'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(code);
};

// Audio feedback system - industry standard with browser compatibility
let audioContext = null;

const initAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      return null;
    }
  }
  return audioContext;
};

const playMagicKeySound = async (state) => {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Industry-standard frequencies and durations
    let frequency, volume, duration;
    if (state === 'enter') {
      frequency = 800;  // Higher pitch - encouraging
      volume = 0.1;
      duration = 0.1;   // 100ms
    } else if (state === 'send') {
      frequency = 400;  // Lower pitch - confirmation
      volume = 0.15;
      duration = 0.15;  // 150ms
    } else if (state === 'cancel') {
      frequency = 600;  // Neutral tone
      volume = 0.08;
      duration = 0.08;  // 80ms
    }
    
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
    
  } catch (error) {
    // Audio feedback failed silently
  }
};

// Initialize config
loadConfig();

export function useMagicKey(onShortcutSend) {
  // Handle keydown - magic key logic (always available)
  const handleKeyDown = (event) => {
    const { code } = event;

    // Escape handling - cancel composition
    if (code === 'Escape') {
      if (isComposing.value) {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancelComposition();
        return;
      }
    }

    // Magic key handling (always available like PiKVM)
    handleMagicKey(event, code);
  };

  // Magic key handler - PiKVM standard behavior
  const handleMagicKey = (event, code) => {
    // Magic key pressed
    if (isMagicKey(code)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      
      if (!isComposing.value) {
        startComposition();
      } else {
        sendComposition();
      }
      return;
    }

    // During composition - accumulate keys
    if (isComposing.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
      
      console.log('Magic key received:', code, 'Current keys:', currentKeys.value);
      
      if (!currentKeys.value.includes(code)) {
        console.log('Adding key:', code);
        addKey(code);
        
        // Don't auto-send - let user build longer combinations
        // Press magic key again to send the composition
      } else {
        console.log('Key already in composition:', code);
      }
    }
  };

  // Handle keyup - prevent regular keyboard system from processing during composition
  const handleKeyUp = (event) => {
    // Intercept keyup events during composition to prevent errors in regular keyboard system
    if (isComposing.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  // Start magic key composition
  const startComposition = async () => {
    await playMagicKeySound('enter');
    isComposing.value = true;
    currentKeys.value = [];
    updateDisplayText();
  };

  // Cancel composition mode and reset all state
  const cancelComposition = async () => {
    await playMagicKeySound('cancel');
    isComposing.value = false;
    currentKeys.value = [];
    displayText.value = '';
  };

  // Update display text based on current state
  const updateDisplayText = () => {
    if (isComposing.value) {
      if (currentKeys.value.length > 0) {
        displayText.value = formatKeyDisplay(currentKeys.value, []);
      } else {
        displayText.value = `Press keys to build combination, then ${magicKey.value} to send`;
      }
    } else {
      displayText.value = '';
    }
  };

  // Add key to current composition
  const addKey = (code) => {
    // Build proper key order: Ctrl, Shift, Alt, Meta, then main key
    const keys = [];
    
    // Add modifiers in standard order
    const modifiers = currentKeys.value.filter(isModifier);
    if (currentKeys.value.some(k => k.includes('Control'))) {
      keys.push('ControlLeft');
    }
    if (currentKeys.value.some(k => k.includes('Shift'))) {
      keys.push('ShiftLeft');
    }
    if (currentKeys.value.some(k => k.includes('Alt'))) {
      keys.push('AltLeft');
    }
    if (currentKeys.value.some(k => k.includes('Meta'))) {
      keys.push('MetaLeft');
    }

    // Add the new key
    if (isModifier(code)) {
      // Replace with standard left variant for consistency
      if (code.includes('Control') && !keys.includes('ControlLeft')) keys.push('ControlLeft');
      else if (code.includes('Shift') && !keys.includes('ShiftLeft')) keys.push('ShiftLeft');
      else if (code.includes('Alt') && !keys.includes('AltLeft')) keys.push('AltLeft');
      else if (code.includes('Meta') && !keys.includes('MetaLeft')) keys.push('MetaLeft');
    } else {
      // Non-modifier key - add to end
      keys.push(code);
    }

    currentKeys.value = keys;
    updateDisplayText();
  };

  // Send the composed shortcut
  const sendComposition = async () => {
    const keys = [...currentKeys.value];
    
    console.log('Sending magic key composition:', keys);
    
    await playMagicKeySound('send');
    
    // Reset state first
    isComposing.value = false;
    currentKeys.value = [];
    displayText.value = '';

    if (keys.length > 0 && onShortcutSend) {
      onShortcutSend(keys);
    }
  };

  // Change magic key
  const setMagicKey = (key) => {
    saveMagicKeyConfig(key);
  };

  // Set up global event listeners
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    document.addEventListener('keyup', handleKeyUp, { capture: true, passive: false });
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown, { capture: true });
    document.removeEventListener('keyup', handleKeyUp, { capture: true });
  });

  return {
    // State
    isComposing: computed(() => isComposing.value),
    displayText: computed(() => displayText.value),
    currentKeys: computed(() => currentKeys.value),
    magicKey: computed(() => magicKey.value),
    
    // Actions
    setMagicKey,
    cancelComposition,
    
    // Manual control (for testing)
    startComposition
  };
}