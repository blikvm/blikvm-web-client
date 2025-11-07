'use strict';

import { ref, nextTick } from 'vue';
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import { useKeyboard } from '@/composables/useKeyboard-new.js';

/**
 * Mobile keyboard composable using simple-keyboard
 * Integrates with the main keyboard system for consistent event handling
 */
export function useMobileKeyboard() {
  // Use the main keyboard system for consistent event handling
  const { handleKeyPress, handleKeyReleased } = useKeyboard();
  
  // Mobile keyboard state
  const keyboardInstance = ref(null);
  const currentInput = ref('');
  const isInitialized = ref(false);
  const currentLayoutName = ref('default');
  
  // Mobile keyboard layouts
  const layouts = {
    default: [
      "q w e r t y u i o p",
      "a s d f g h j k l",
      "{shift} z x c v b n m {backspace}",
      "{numbers} {space} {ent}"
    ],
    shift: [
      "Q W E R T Y U I O P",
      "A S D F G H J K L",
      "{shift} Z X C V B N M {backspace}",
      "{numbers} {space} {ent}"
    ],
    numbers: [
      "1 2 3", 
      "4 5 6", 
      "7 8 9", 
      "{abc} 0 {backspace}"
    ]
  };

  // Display names for special keys
  const display = {
    "{numbers}": "123",
    "{ent}": "return",
    "{escape}": "esc ⎋",
    "{tab}": "tab ⇥",
    "{backspace}": "⌫",
    "{capslock}": "caps lock ⇪",
    "{shift}": "⇧",
    "{controlleft}": "ctrl ⌃",
    "{controlright}": "ctrl ⌃",
    "{altleft}": "alt ⌥",
    "{altright}": "alt ⌥",
    "{metaleft}": "cmd ⌘",
    "{metaright}": "cmd ⌘",
    "{abc}": "ABC",
    "{space}": " "
  };

  // Map simple-keyboard buttons to standard key codes
  const mapButtonToKeyCode = (button) => {
    const keyMap = {
      '{backspace}': 'Backspace',
      '{enter}': 'Enter',
      '{ent}': 'Enter',
      '{space}': 'Space',
      '{tab}': 'Tab',
      '{escape}': 'Escape',
      '{capslock}': 'CapsLock',
      '{shift}': 'ShiftLeft',
      '{controlleft}': 'ControlLeft',
      '{controlright}': 'ControlRight',
      '{altleft}': 'AltLeft',
      '{altright}': 'AltRight',
      '{metaleft}': 'MetaLeft',
      '{metaright}': 'MetaRight'
    };

    // Return mapped key or the button itself for regular characters
    return keyMap[button] || button;
  };

  // Handle key press from simple-keyboard
  const onKeyPress = (button) => {

    // Handle layout switching
    if (button === "{shift}" || button === "{lock}") {
      handleShift();
      return;
    }
    if (button === "{numbers}") {
      handleNumbers();
      return;
    }
    if (button === "{abc}") {
      handleLetters();
      return;
    }

    // Map button to key code and send to main system
    const keyCode = mapButtonToKeyCode(button);
    
    // Send key press and release events to server via main system
    // The main system expects just the button/key string, not an object
    handleKeyPress(keyCode);
    // Immediately release the key (like a tap)
    setTimeout(() => {
      handleKeyReleased(keyCode);
    }, 50);
  };

  // Handle input changes (for text display)
  const onInputChange = (input) => {
    currentInput.value = input;
  };

  // Layout switching functions
  const handleShift = () => {
    const newLayout = currentLayoutName.value === "default" ? "shift" : "default";
    setLayout(newLayout);
  };

  const handleNumbers = () => {
    const newLayout = currentLayoutName.value !== "numbers" ? "numbers" : "default";
    setLayout(newLayout);
  };

  const handleLetters = () => {
    setLayout("default");
  };

  // Set keyboard layout
  const setLayout = (layoutName) => {
    currentLayoutName.value = layoutName;
    if (keyboardInstance.value) {
      keyboardInstance.value.setOptions({
        layoutName: layoutName
      });
    }
  };

  // Initialize mobile keyboard
  const initializeMobileKeyboard = async (container, options = {}) => {
    if (!container) {
      console.error('Mobile keyboard container not provided');
      return false;
    }

    await nextTick();

    try {
      const keyboardOptions = {
        onChange: onInputChange,
        onKeyPress: onKeyPress,
        mergeDisplay: true,
        layoutName: currentLayoutName.value,
        layout: layouts,
        display: display,
        theme: "hg-theme-default mobile-keyboard-theme",
        ...options
      };

      keyboardInstance.value = new Keyboard(container, keyboardOptions);
      isInitialized.value = true;
      
      return true;
    } catch (error) {
      console.error('Failed to initialize mobile keyboard:', error);
      return false;
    }
  };

  // Destroy keyboard
  const destroyKeyboard = () => {
    if (keyboardInstance.value && keyboardInstance.value.destroy) {
      keyboardInstance.value.destroy();
    }
    keyboardInstance.value = null;
    isInitialized.value = false;
  };

  // Set input value
  const setInput = (input) => {
    currentInput.value = input;
    if (keyboardInstance.value) {
      keyboardInstance.value.setInput(input);
    }
  };

  // Clear input
  const clearInput = () => {
    setInput('');
  };

  // Set keyboard theme
  const setTheme = (themeName) => {
    if (keyboardInstance.value) {
      keyboardInstance.value.setOptions({
        theme: `hg-theme-default ${themeName}`
      });
    }
  };

  // Get available layouts
  const getAvailableLayouts = () => {
    return Object.keys(layouts);
  };

  // Check if current layout is numbers
  const isNumbersLayout = () => {
    return currentLayoutName.value === 'numbers';
  };

  // Get current input
  const getInput = () => {
    return currentInput.value;
  };

  // Get current layout
  const getCurrentLayout = () => {
    return currentLayoutName.value;
  };

  // Initialize keyboard (alias for compatibility)
  const initializeKeyboard = initializeMobileKeyboard;

  return {
    // State
    keyboardInstance,
    currentInput,
    isInitialized,
    currentLayoutName,

    // Layout management
    setLayout,
    handleShift,
    handleNumbers,
    handleLetters,
    getAvailableLayouts,
    getCurrentLayout,
    isNumbersLayout,

    // Input management
    setInput,
    getInput,
    clearInput,

    // Keyboard lifecycle
    initializeMobileKeyboard,
    initializeKeyboard,
    destroyKeyboard,
    setTheme,

    // Event handlers
    onKeyPress,
    onInputChange,

    // Configuration
    layouts,
    display
  };
}