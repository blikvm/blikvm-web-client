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
 * ADAPTIVE SHORTCUTS - SIMPLIFIED FOR RELIABILITY
 * ===============================================
 * 
 * FOCUS: Manual shortcut management with smart features
 * 
 * WORKING FEATURES:
 * ----------------
 * ✅ Manual shortcut recording (red record button)
 * ✅ Pin/unpin shortcuts with double-click and star icons  
 * ✅ Smart sorting (pinned → usage count → recency → alphabetical)
 * ✅ Usage tracking for shortcuts clicked in UI
 * ✅ OS-specific smart defaults on first load
 * ✅ Persistent storage with cleanup
 * 
 * REMOVED FEATURES:
 * ----------------
 * ❌ Auto-learning (was broken and complex)
 * ❌ Magic key detection (unreliable in browser/KVM context)
 * ❌ Learning thresholds and notifications
 * 
 * PHILOSOPHY: Simple, reliable, user-controlled shortcut management
 */

import { ref, computed, watch } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

// Singleton pattern - shared state across components
const STORAGE_KEY = 'blikvm-adaptive-shortcuts';
const CLEANUP_DAYS = 30;

// Adaptive shortcuts data structure
const adaptiveShortcuts = ref({});
let saveTimeout = null;

// Get smart defaults for current OS
const getSmartDefaults = (os) => {
  const isMac = os === 'macos' || os === 'ios';
  const modifier = isMac ? 'MetaLeft' : 'ControlLeft';
  
  return [
    { key: [modifier, 'KeyC'], name: 'Copy', pinned: true },
    { key: [modifier, 'KeyV'], name: 'Paste', pinned: true },
    { key: [modifier, 'KeyZ'], name: 'Undo', pinned: true }
  ];
};

// Load adaptive shortcuts from localStorage
const loadAdaptiveShortcuts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      adaptiveShortcuts.value = parsed || {};
    }
    cleanupOldShortcuts();
  } catch (error) {
    console.warn('Failed to load adaptive shortcuts:', error);
    adaptiveShortcuts.value = {};
  }
};

// Save adaptive shortcuts to localStorage (debounced)
const saveAdaptiveShortcuts = () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adaptiveShortcuts.value));
    } catch (error) {
      console.warn('Failed to save adaptive shortcuts:', error);
    }
  }, 500); // Debounce saves
};

// Initialize smart defaults for an OS
const initializeSmartDefaults = (targetOS = 'windows') => {
  const defaults = getSmartDefaults(targetOS);
  
  defaults.forEach(({ key, name, pinned }) => {
    const shortcutKey = Array.isArray(key) ? key.join('+') : key;
    
    // Only add if not already exists
    if (!adaptiveShortcuts.value[shortcutKey]) {
      adaptiveShortcuts.value[shortcutKey] = {
        count: 1,
        pinned,
        lastUsed: Date.now(),
        name,
        category: 'default',
        os: targetOS
      };
    }
  });
  saveAdaptiveShortcuts();
};

// Clean up shortcuts not used in the last CLEANUP_DAYS
const cleanupOldShortcuts = () => {
  const cutoffTime = Date.now() - (CLEANUP_DAYS * 24 * 60 * 60 * 1000);
  let hasChanges = false;
  
  Object.keys(adaptiveShortcuts.value).forEach(key => {
    const shortcut = adaptiveShortcuts.value[key];
    if (!shortcut.pinned && shortcut.lastUsed < cutoffTime) {
      delete adaptiveShortcuts.value[key];
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    saveAdaptiveShortcuts();
  }
};

// Convert shortcut keys to a consistent string format
const normalizeShortcutKey = (keys) => {
  if (typeof keys === 'string') {
    return keys;
  }
  if (Array.isArray(keys)) {
    return keys.join('+');
  }
  return String(keys);
};

// Initialize on module load
loadAdaptiveShortcuts();

export function useAdaptiveShortcuts() {
  const store = useAppStore();
  const { keyboard, settings } = storeToRefs(store);
  
  // Get current target OS
  const currentOS = computed(() => settings.value?.targetOS || 'windows');
  
  // Initialize smart defaults when OS changes
  watch(currentOS, (newOS) => {
    if (newOS) {
      initializeSmartDefaults(newOS);
    }
  }, { immediate: true });
  
  // Track shortcut usage for manual shortcuts
  const trackShortcutUsage = (shortcut, source = 'manual') => {
    if (!shortcut) return;
    
    const key = normalizeShortcutKey(shortcut.value || shortcut.keys);
    const name = shortcut.name || 'Unknown';
    const category = shortcut.category || 'custom';
    
    if (!key) return;
    
    const existing = adaptiveShortcuts.value[key];
    
    // Prevent double tracking from same source within short time
    if (existing?.lastTracked && existing?.lastSource === source) {
      const timeSinceLastTrack = Date.now() - existing.lastTracked;
      if (timeSinceLastTrack < 1000) { // 1 second debounce
        return;
      }
    }
    
    adaptiveShortcuts.value[key] = {
      count: (existing?.count || 0) + 1,
      pinned: existing?.pinned || false,
      lastUsed: Date.now(),
      lastTracked: Date.now(),
      lastSource: source,
      name,
      category,
      os: currentOS.value
    };
    
    saveAdaptiveShortcuts();
  };
  
  
  // Toggle pin status of a shortcut
  const togglePin = (shortcutKey) => {
    const key = normalizeShortcutKey(shortcutKey);
    if (adaptiveShortcuts.value[key]) {
      adaptiveShortcuts.value[key].pinned = !adaptiveShortcuts.value[key].pinned;
      saveAdaptiveShortcuts();
    }
  };
  
  // Check if a shortcut is pinned
  const isPinned = (shortcutKey) => {
    const key = normalizeShortcutKey(shortcutKey);
    return adaptiveShortcuts.value[key]?.pinned || false;
  };
  
  // Get usage count for a shortcut
  const getUsageCount = (shortcutKey) => {
    const key = normalizeShortcutKey(shortcutKey);
    return adaptiveShortcuts.value[key]?.count || 0;
  };
  
  // Get adaptive shortcuts sorted by priority
  const getAdaptiveShortcuts = (allShortcuts = []) => {
    // Get all shortcuts that are pinned or have been used
    const adaptiveKeys = Object.keys(adaptiveShortcuts.value).filter(key => {
      const shortcut = adaptiveShortcuts.value[key];
      return shortcut.pinned || shortcut.count > 0;
    });
    
    // Map to actual shortcuts with adaptive data
    const adaptiveList = [];
    
    adaptiveKeys.forEach(key => {
      const adaptiveData = adaptiveShortcuts.value[key];
      
      // Find matching shortcut in allShortcuts
      let matchingShortcut = allShortcuts.find(s => 
        normalizeShortcutKey(s.value) === key
      );
      
      if (!matchingShortcut) {
        // Create a shortcut entry for magic key or missing shortcuts
        matchingShortcut = {
          name: adaptiveData.name,
          value: key,
          category: adaptiveData.category || 'adaptive'
        };
      }
      
      adaptiveList.push({
        ...matchingShortcut,
        adaptiveData
      });
    });
    
    // Sort by: pinned first, then by usage count, then by last used
    adaptiveList.sort((a, b) => {
      const aData = a.adaptiveData;
      const bData = b.adaptiveData;
      
      // Pinned shortcuts come first
      if (aData.pinned && !bData.pinned) return -1;
      if (!aData.pinned && bData.pinned) return 1;
      
      // Then by usage count (descending)
      if (aData.count !== bData.count) {
        return bData.count - aData.count;
      }
      
      // Finally by last used (descending)
      return bData.lastUsed - aData.lastUsed;
    });
    
    return adaptiveList;
  };
  
  // Check if adaptive mode should be enabled
  const hasAdaptiveShortcuts = computed(() => {
    return Object.keys(adaptiveShortcuts.value).some(key => {
      const shortcut = adaptiveShortcuts.value[key];
      return shortcut.pinned || shortcut.count > 0;
    });
  });
  
  // Clear all adaptive data (reset)
  const clearAdaptiveShortcuts = () => {
    adaptiveShortcuts.value = {};
    saveAdaptiveShortcuts();
    initializeSmartDefaults(currentOS.value);
  };
  
  // Export adaptive shortcuts data (for debugging/settings)
  const exportAdaptiveShortcuts = () => {
    return { ...adaptiveShortcuts.value };
  };
  
  return {
    adaptiveShortcuts: computed(() => adaptiveShortcuts.value),
    trackShortcutUsage,
    togglePin,
    isPinned,
    getUsageCount,
    getAdaptiveShortcuts,
    hasAdaptiveShortcuts,
    clearAdaptiveShortcuts,
    exportAdaptiveShortcuts,
    currentOS
  };
}