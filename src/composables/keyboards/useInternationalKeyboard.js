'use strict';

import { ref, nextTick } from 'vue';
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import { useKeyboardBase } from './useKeyboardBase.js';

// Import international layouts from simple-keyboard-layouts
// These will be loaded dynamically based on language selection
const availableLanguages = {
  'en': { name: 'English', module: null }, // Default, no import needed
  'es': { name: 'Español', module: () => import('simple-keyboard-layouts/build/layouts/spanish') },
  'fr': { name: 'Français', module: () => import('simple-keyboard-layouts/build/layouts/french') },
  'de': { name: 'Deutsch', module: () => import('simple-keyboard-layouts/build/layouts/german') },
  'it': { name: 'Italiano', module: () => import('simple-keyboard-layouts/build/layouts/italian') },
  'pt': { name: 'Português', module: () => import('simple-keyboard-layouts/build/layouts/portuguese') },
  'ru': { name: 'Русский', module: () => import('simple-keyboard-layouts/build/layouts/russian') },
  'ar': { name: 'العربية', module: () => import('simple-keyboard-layouts/build/layouts/arabic') },
  'zh': { name: '中文', module: () => import('simple-keyboard-layouts/build/layouts/chinese') },
  'ja': { name: '日本語', module: () => import('simple-keyboard-layouts/build/layouts/japanese') },
  'ko': { name: '한국어', module: () => import('simple-keyboard-layouts/build/layouts/korean') },
};

/**
 * International keyboard composable supporting multiple languages
 */
export function useInternationalKeyboard() {
  const base = useKeyboardBase();
  
  // International-specific state
  const currentLanguage = ref('en');
  const currentLayoutName = ref('default');
  const loadedLayouts = ref({});
  const isLoadingLayout = ref(false);

  // Default English layout
  const defaultLayouts = {
    default: [
      "` 1 2 3 4 5 6 7 8 9 0 - = {backspace}",
      "{tab} q w e r t y u i o p [ ] \\",
      "{capslock} a s d f g h j k l ; ' {enter}",
      "{shift} z x c v b n m , . / {shift}",
      ".com @ {space}"
    ],
    shift: [
      "~ ! @ # $ % ^ & * ( ) _ + {backspace}",
      "{tab} Q W E R T Y U I O P { } |",
      "{capslock} A S D F G H J K L : \" {enter}",
      "{shift} Z X C V B N M < > ? {shift}",
      ".com @ {space}"
    ]
  };

  // Display names for special keys (international)
  const display = {
    "{backspace}": "⌫",
    "{enter}": "↵",
    "{shift}": "⇧",
    "{tab}": "⇥",
    "{capslock}": "⇪",
    "{space}": " ",
    ".com": ".com",
    "@": "@"
  };

  // Load language layout dynamically
  const loadLanguageLayout = async (languageCode) => {
    if (loadedLayouts.value[languageCode]) {
      return loadedLayouts.value[languageCode];
    }

    if (languageCode === 'en') {
      loadedLayouts.value[languageCode] = defaultLayouts;
      return defaultLayouts;
    }

    const language = availableLanguages[languageCode];
    if (!language || !language.module) {
      console.warn(`Language ${languageCode} not supported, falling back to English`);
      return defaultLayouts;
    }

    try {
      isLoadingLayout.value = true;
      const layoutModule = await language.module();
      const layout = layoutModule.default || layoutModule;
      
      loadedLayouts.value[languageCode] = layout;
      console.log(`Loaded layout for ${language.name}:`, layout);
      return layout;
    } catch (error) {
      console.error(`Failed to load layout for ${languageCode}:`, error);
      return defaultLayouts;
    } finally {
      isLoadingLayout.value = false;
    }
  };

  // Handle international-specific key presses
  const handleKeyPress = (button) => {
    console.log("International keyboard button pressed:", button);
    
    // Handle layout switching
    if (button === "{shift}") {
      handleShift();
    } else if (button === "{capslock}") {
      handleCapsLock();
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

  // Handle caps lock
  const handleCapsLock = () => {
    const newLayout = currentLayoutName.value === "default" ? "shift" : "default";
    currentLayoutName.value = newLayout;
    base.setLayout(newLayout);
  };

  // Switch language
  const switchLanguage = async (languageCode) => {
    if (!availableLanguages[languageCode]) {
      console.warn(`Language ${languageCode} not available`);
      return false;
    }

    try {
      const layout = await loadLanguageLayout(languageCode);
      currentLanguage.value = languageCode;
      
      if (base.keyboardInstance.value) {
        base.keyboardInstance.value.setOptions({
          layout: layout,
          layoutName: currentLayoutName.value
        });
      }
      
      console.log(`Switched to language: ${availableLanguages[languageCode].name}`);
      return true;
    } catch (error) {
      console.error(`Failed to switch to language ${languageCode}:`, error);
      return false;
    }
  };

  // Initialize international keyboard
  const initializeInternationalKeyboard = async (container, options = {}) => {
    if (!container) {
      console.error('International keyboard container not provided');
      return false;
    }

    await nextTick();

    try {
      const layout = await loadLanguageLayout(currentLanguage.value);
      
      const keyboardOptions = {
        onChange: base.onInputChange,
        onKeyPress: handleKeyPress,
        layoutName: currentLayoutName.value,
        layout: layout,
        display: display,
        theme: "hg-theme-default international-keyboard-theme",
        ...options
      };

      base.keyboardInstance.value = new Keyboard(container, keyboardOptions);
      base.isInitialized.value = true;
      
      console.log('International keyboard initialized:', base.keyboardInstance.value);
      return true;
    } catch (error) {
      console.error('Failed to initialize international keyboard:', error);
      return false;
    }
  };

  // Get available languages
  const getAvailableLanguages = () => {
    return Object.entries(availableLanguages).map(([code, info]) => ({
      code,
      name: info.name
    }));
  };

  // Get current language info
  const getCurrentLanguageInfo = () => {
    return {
      code: currentLanguage.value,
      name: availableLanguages[currentLanguage.value]?.name || 'Unknown'
    };
  };

  return {
    // Inherit from base
    ...base,
    
    // International-specific state
    currentLanguage,
    currentLayoutName,
    loadedLayouts,
    isLoadingLayout,
    availableLanguages,
    
    // International-specific methods
    initializeInternationalKeyboard,
    loadLanguageLayout,
    switchLanguage,
    handleShift,
    handleCapsLock,
    getAvailableLanguages,
    getCurrentLanguageInfo,
    
    // Override base methods with international-specific implementations
    initializeKeyboard: initializeInternationalKeyboard,
    onKeyPress: handleKeyPress,
  };
}