'use strict';

import { ref, nextTick } from 'vue';
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import { useKeyboardBase } from './useKeyboardBase.js';

/**
 * Mobile keyboard composable using simple-keyboard
 * Based on the provided JavaScript code
 */
export function useMobileKeyboard() {
  const base = useKeyboardBase();
  
  // Mobile-specific state
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
    "{abc}": "ABC"
  };

  // Handle mobile-specific key presses
  const handleKeyPress = (button) => {
    console.log("Mobile keyboard button pressed:", button);
    
    // Handle layout switching
    if (button === "{shift}" || button === "{lock}") {
      handleShift();
    } else if (button === "{numbers}" || button === "{abc}") {
      handleNumbers();
    }
    
    // Call base onKeyPress for additional processing
    base.onKeyPress(button);
  };

  // Handle shift key toggle
  const handleShift = () => {
    const newLayout = currentLayoutName.value === "default" ? "shift" : "default";
    currentLayoutName.value = newLayout;
    base.setLayout(newLayout);
  };

  // Handle numbers/letters toggle
  const handleNumbers = () => {
    const newLayout = currentLayoutName.value !== "numbers" ? "numbers" : "default";
    currentLayoutName.value = newLayout;
    base.setLayout(newLayout);
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
        onChange: base.onInputChange,
        onKeyPress: handleKeyPress,
        mergeDisplay: true,
        layoutName: currentLayoutName.value,
        layout: layouts,
        display: display,
        theme: "hg-theme-default mobile-keyboard-theme",
        ...options
      };

      base.keyboardInstance.value = new Keyboard(container, keyboardOptions);
      base.isInitialized.value = true;
      
      console.log('Mobile keyboard initialized:', base.keyboardInstance.value);
      return true;
    } catch (error) {
      console.error('Failed to initialize mobile keyboard:', error);
      return false;
    }
  };

  // Set mobile keyboard theme
  const setTheme = (themeName) => {
    if (base.keyboardInstance.value) {
      base.keyboardInstance.value.setOptions({
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

  // Check if current layout is shift
  const isShiftLayout = () => {
    return currentLayoutName.value === 'shift';
  };

  return {
    // Inherit from base
    ...base,
    
    // Mobile-specific state
    currentLayoutName,
    layouts,
    display,
    
    // Mobile-specific methods
    initializeMobileKeyboard,
    handleShift,
    handleNumbers,
    setTheme,
    getAvailableLayouts,
    isNumbersLayout,
    isShiftLayout,
    
    // Override base methods with mobile-specific implementations
    initializeKeyboard: initializeMobileKeyboard,
    onKeyPress: handleKeyPress,
  };
}