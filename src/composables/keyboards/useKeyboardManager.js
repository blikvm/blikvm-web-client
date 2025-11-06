'use strict';

import { ref, computed, watch } from 'vue';
import { useMobileKeyboard } from './useMobileKeyboard.js';
import { useInternationalKeyboard } from './useInternationalKeyboard.js';

/**
 * Central keyboard manager that handles multiple keyboard types
 */
export function useKeyboardManager() {
  // Available keyboard types
  const KEYBOARD_TYPES = {
    MOBILE: 'mobile',
    INTERNATIONAL: 'international',
    VIRTUAL: 'virtual', // For future expansion
    GAMING: 'gaming',   // For future expansion
  };

  // Current keyboard state
  const currentKeyboardType = ref(KEYBOARD_TYPES.MOBILE);
  const isKeyboardVisible = ref(false);
  const keyboardContainer = ref(null);
  
  // Keyboard instances
  const keyboards = ref({
    [KEYBOARD_TYPES.MOBILE]: null,
    [KEYBOARD_TYPES.INTERNATIONAL]: null,
  });

  // Initialize keyboard instances
  const initializeKeyboards = () => {
    keyboards.value[KEYBOARD_TYPES.MOBILE] = useMobileKeyboard();
    keyboards.value[KEYBOARD_TYPES.INTERNATIONAL] = useInternationalKeyboard();
  };

  // Get current active keyboard
  const getCurrentKeyboard = computed(() => {
    return keyboards.value[currentKeyboardType.value];
  });

  // Check if current keyboard is initialized
  const isCurrentKeyboardInitialized = computed(() => {
    const keyboard = getCurrentKeyboard.value;
    return keyboard?.isInitialized?.value || false;
  });

  // Switch keyboard type
  const switchKeyboardType = async (type) => {
    if (!Object.values(KEYBOARD_TYPES).includes(type)) {
      console.warn(`Unknown keyboard type: ${type}`);
      return false;
    }

    // Hide current keyboard first
    if (isKeyboardVisible.value) {
      await hideKeyboard();
    }

    currentKeyboardType.value = type;
    console.log(`Switched to keyboard type: ${type}`);
    return true;
  };

  // Show keyboard
  const showKeyboard = async (container = null) => {
    try {
      const targetContainer = container || keyboardContainer.value;
      if (!targetContainer) {
        console.error('No keyboard container available');
        return false;
      }

      const keyboard = getCurrentKeyboard.value;
      if (!keyboard) {
        console.error('No keyboard instance available');
        return false;
      }

      // Initialize keyboard if not already done
      if (!keyboard.isInitialized.value) {
        const success = await keyboard.initializeKeyboard(targetContainer);
        if (!success) {
          console.error('Failed to initialize keyboard');
          return false;
        }
      }

      isKeyboardVisible.value = true;
      console.log(`${currentKeyboardType.value} keyboard shown`);
      return true;
    } catch (error) {
      console.error('Error showing keyboard:', error);
      return false;
    }
  };

  // Hide keyboard
  const hideKeyboard = async () => {
    try {
      const keyboard = getCurrentKeyboard.value;
      if (keyboard && keyboard.isInitialized.value) {
        keyboard.destroyKeyboard();
      }
      
      isKeyboardVisible.value = false;
      console.log(`${currentKeyboardType.value} keyboard hidden`);
      return true;
    } catch (error) {
      console.error('Error hiding keyboard:', error);
      return false;
    }
  };

  // Toggle keyboard visibility
  const toggleKeyboard = async (container = null) => {
    if (isKeyboardVisible.value) {
      return await hideKeyboard();
    } else {
      return await showKeyboard(container);
    }
  };

  // Set keyboard container
  const setKeyboardContainer = (container) => {
    keyboardContainer.value = container;
  };

  // Get current input from active keyboard
  const getCurrentInput = () => {
    const keyboard = getCurrentKeyboard.value;
    return keyboard?.getInput?.() || '';
  };

  // Set input to active keyboard
  const setInput = (input) => {
    const keyboard = getCurrentKeyboard.value;
    if (keyboard?.setInput) {
      keyboard.setInput(input);
    }
  };

  // Clear input from active keyboard
  const clearInput = () => {
    const keyboard = getCurrentKeyboard.value;
    if (keyboard?.clearInput) {
      keyboard.clearInput();
    }
  };

  // Get keyboard capabilities
  const getKeyboardCapabilities = () => {
    const keyboard = getCurrentKeyboard.value;
    const capabilities = {
      type: currentKeyboardType.value,
      hasLayouts: false,
      hasLanguages: false,
      hasThemes: false,
      layouts: [],
      languages: [],
    };

    if (currentKeyboardType.value === KEYBOARD_TYPES.MOBILE) {
      capabilities.hasLayouts = true;
      capabilities.hasThemes = true;
      capabilities.layouts = keyboard?.getAvailableLayouts?.() || [];
    } else if (currentKeyboardType.value === KEYBOARD_TYPES.INTERNATIONAL) {
      capabilities.hasLayouts = true;
      capabilities.hasLanguages = true;
      capabilities.languages = keyboard?.getAvailableLanguages?.() || [];
    }

    return capabilities;
  };

  // Watch for keyboard type changes and cleanup
  watch(currentKeyboardType, async (newType, oldType) => {
    if (oldType && isKeyboardVisible.value) {
      await hideKeyboard();
    }
  });

  // Initialize keyboards on setup
  initializeKeyboards();

  return {
    // Constants
    KEYBOARD_TYPES,
    
    // State
    currentKeyboardType,
    isKeyboardVisible,
    keyboardContainer,
    keyboards,
    
    // Computed
    getCurrentKeyboard,
    isCurrentKeyboardInitialized,
    
    // Methods
    switchKeyboardType,
    showKeyboard,
    hideKeyboard,
    toggleKeyboard,
    setKeyboardContainer,
    getCurrentInput,
    setInput,
    clearInput,
    getKeyboardCapabilities,
  };
}