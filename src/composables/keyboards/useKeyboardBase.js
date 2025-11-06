'use strict';

import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * Base keyboard composable that provides common functionality for all keyboard types
 */
export function useKeyboardBase() {
  const keyboardInstance = ref(null);
  const currentInput = ref('');
  const isInitialized = ref(false);
  
  // Common keyboard events
  const onInputChange = (input) => {
    currentInput.value = input;
    console.log('Keyboard input changed:', input);
  };

  const onKeyPress = (button) => {
    console.log('Key pressed:', button);
    // This will be overridden by specific keyboard implementations
  };

  // Keyboard lifecycle management
  const initializeKeyboard = (container, options = {}) => {
    if (!container) {
      console.error('Keyboard container not provided');
      return false;
    }

    try {
      // This will be implemented by specific keyboard types
      isInitialized.value = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize keyboard:', error);
      return false;
    }
  };

  const destroyKeyboard = () => {
    if (keyboardInstance.value && keyboardInstance.value.destroy) {
      keyboardInstance.value.destroy();
    }
    keyboardInstance.value = null;
    isInitialized.value = false;
  };

  // Input management
  const setInput = (input) => {
    if (keyboardInstance.value && keyboardInstance.value.setInput) {
      keyboardInstance.value.setInput(input);
      currentInput.value = input;
    }
  };

  const getInput = () => {
    return currentInput.value;
  };

  const clearInput = () => {
    setInput('');
  };

  // Layout management
  const setLayout = (layoutName) => {
    if (keyboardInstance.value && keyboardInstance.value.setOptions) {
      keyboardInstance.value.setOptions({
        layoutName: layoutName
      });
    }
  };

  const getCurrentLayout = () => {
    return keyboardInstance.value?.options?.layoutName || 'default';
  };

  // Cleanup on unmount
  onBeforeUnmount(() => {
    destroyKeyboard();
  });

  return {
    // State
    keyboardInstance,
    currentInput,
    isInitialized,
    
    // Methods
    initializeKeyboard,
    destroyKeyboard,
    setInput,
    getInput,
    clearInput,
    setLayout,
    getCurrentLayout,
    onInputChange,
    onKeyPress,
  };
}