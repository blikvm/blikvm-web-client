<template>
  <div class="mobile-keyboard-container">
    <!-- Keyboard Header -->
    <div v-if="showHeader" class="keyboard-header">
      <div class="keyboard-info">
        <v-icon color="#76FF03" size="small" class="mr-2">
          mdi-keyboard
        </v-icon>
        <span class="text-caption">
          {{ currentLayoutName.toUpperCase() }} Layout
        </span>
      </div>
      
      <div class="keyboard-actions">
        <v-btn
          v-if="showLanguageToggle"
          size="small"
          variant="text"
          color="#76FF03"
          @click="toggleLayoutMode"
        >
          {{ isNumbersLayout ? 'ABC' : '123' }}
        </v-btn>
        
        <v-btn
          size="small"
          variant="text"
          color="#76FF03"
          @click="clearInput"
        >
          <v-icon size="small">mdi-backspace-outline</v-icon>
        </v-btn>
        
        <v-btn
          v-if="showCloseButton"
          size="small"
          variant="text"
          color="#D32F2F"
          @click="$emit('close')"
        >
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Input Display -->
    <div v-if="showInputDisplay" class="keyboard-input-display">
      <v-text-field
        :model-value="currentInput"
        :placeholder="inputPlaceholder"
        readonly
        density="compact"
        variant="outlined"
        color="#76FF03"
        class="keyboard-input"
        @click="focusKeyboard"
      >
        <template v-slot:append>
          <v-btn
            size="small"
            variant="text"
            color="#76FF03"
            @click="copyToClipboard"
          >
            <v-icon size="small">mdi-content-copy</v-icon>
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <!-- Keyboard Container -->
    <div 
      ref="keyboardContainer" 
      class="keyboard-wrapper"
      :class="{ 'keyboard-minimal': !showHeader && !showInputDisplay }"
    >
    </div>

    <!-- Status Bar -->
    <div v-if="showStatusBar" class="keyboard-status">
      <div class="status-left">
        <v-chip
          size="x-small"
          :color="isInitialized ? '#76FF03' : '#D32F2F'"
          variant="flat"
        >
          {{ isInitialized ? 'Ready' : 'Loading...' }}
        </v-chip>
      </div>
      
      <div class="status-right">
        <span class="text-caption text-medium-emphasis">
          {{ inputLength }} chars
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useMobileKeyboard } from '@/composables/keyboards/useMobileKeyboard.js';
import { useClipboard } from '@/composables/useClipboard.js';
import './mobile-keyboard.css';

// Props
const props = defineProps({
  showHeader: {
    type: Boolean,
    default: true
  },
  showInputDisplay: {
    type: Boolean,
    default: true
  },
  showStatusBar: {
    type: Boolean,
    default: true
  },
  showLanguageToggle: {
    type: Boolean,
    default: true
  },
  showCloseButton: {
    type: Boolean,
    default: false
  },
  inputPlaceholder: {
    type: String,
    default: 'Type here...'
  },
  theme: {
    type: String,
    default: 'mobile-keyboard-theme'
  },
  autoFocus: {
    type: Boolean,
    default: true
  }
});


// Emits
const emit = defineEmits(['input-change', 'key-press', 'close', 'ready']);

// Composables
const mobileKeyboard = useMobileKeyboard();
const { copyClipboard } = useClipboard();

// Template refs
const keyboardContainer = ref(null);

// Computed properties
const currentInput = computed(() => mobileKeyboard.currentInput.value);
const currentLayoutName = computed(() => mobileKeyboard.currentLayoutName.value);
const isInitialized = computed(() => mobileKeyboard.isInitialized.value);
const isNumbersLayout = computed(() => mobileKeyboard.isNumbersLayout());
const inputLength = computed(() => currentInput.value.length);

// Methods
const initializeKeyboard = async () => {
  if (!keyboardContainer.value) {
    console.error('Keyboard container not available');
    return;
  }

  await nextTick();
  
  const options = {
    theme: `hg-theme-default ${props.theme}`,
    // Custom onChange to emit to parent
    onChange: (input) => {
      mobileKeyboard.onInputChange(input);
      emit('input-change', input);
    },
    // Custom onKeyPress to emit to parent
    onKeyPress: (button) => {
      mobileKeyboard.onKeyPress(button);
      emit('key-press', button);
    }
  };

  const success = await mobileKeyboard.initializeKeyboard(keyboardContainer.value, options);
  
  if (success) {
    console.log('Mobile keyboard component initialized');
    emit('ready');
    
    if (props.autoFocus) {
      focusKeyboard();
    }
  }
};

const toggleLayoutMode = () => {
  if (isNumbersLayout.value) {
    mobileKeyboard.handleNumbers(); // Switch to ABC
  } else {
    mobileKeyboard.handleNumbers(); // Switch to 123
  }
};

const clearInput = () => {
  mobileKeyboard.clearInput();
  emit('input-change', '');
};

const focusKeyboard = () => {
  // Focus the keyboard for better mobile experience
  if (keyboardContainer.value) {
    const keyboardElement = keyboardContainer.value.querySelector('.hg-theme-default');
    if (keyboardElement) {
      keyboardElement.focus();
    }
  }
};

const copyToClipboard = async () => {
  if (currentInput.value) {
    try {
      await copyClipboard(currentInput.value);
      console.log('Input copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }
};

// Watch for theme changes
watch(() => props.theme, (newTheme) => {
  if (isInitialized.value) {
    mobileKeyboard.setTheme(newTheme);
  }
});

// Lifecycle
onMounted(async () => {
  await initializeKeyboard();
});

onBeforeUnmount(() => {
  mobileKeyboard.destroyKeyboard();
});

// Expose methods for parent component
defineExpose({
  setInput: mobileKeyboard.setInput,
  getInput: mobileKeyboard.getInput,
  clearInput,
  setLayout: mobileKeyboard.setLayout,
  getCurrentLayout: mobileKeyboard.getCurrentLayout,
  focusKeyboard,
  isInitialized
});
</script>

<style scoped>
.mobile-keyboard-container {
  background: #000000;
  border: 1px solid rgba(118, 255, 3, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.keyboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(118, 255, 3, 0.1);
  border-bottom: 1px solid rgba(118, 255, 3, 0.2);
}

.keyboard-info {
  display: flex;
  align-items: center;
  color: #76FF03;
}

.keyboard-actions {
  display: flex;
  gap: 4px;
}

.keyboard-input-display {
  padding: 12px;
  background: rgba(0, 0, 0, 0.5);
}

.keyboard-input {
  font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
}

.keyboard-wrapper {
  padding: 8px;
  min-height: 200px;
}

.keyboard-wrapper.keyboard-minimal {
  padding: 4px;
}

.keyboard-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: rgba(118, 255, 3, 0.05);
  border-top: 1px solid rgba(118, 255, 3, 0.1);
}

.status-left {
  display: flex;
  align-items: center;
}

.status-right {
  display: flex;
  align-items: center;
}

/* Simple Keyboard Theme Customization */
:deep(.hg-theme-default) {
  background-color: transparent;
  border: none;
  border-radius: 4px;
}

:deep(.hg-button) {
  background: rgba(118, 255, 3, 0.1);
  border: 1px solid rgba(118, 255, 3, 0.3);
  color: #ffffff;
  border-radius: 4px;
  margin: 2px;
  font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
  transition: all 0.2s ease;
}

:deep(.hg-button:hover) {
  background: rgba(118, 255, 3, 0.2);
  border-color: rgba(118, 255, 3, 0.5);
}

:deep(.hg-button:active) {
  background: rgba(118, 255, 3, 0.3);
  transform: scale(0.95);
}

:deep(.hg-button.hg-functionBtn) {
  background: rgba(118, 255, 3, 0.2);
  color: #76FF03;
  font-weight: 500;
}

:deep(.hg-button.hg-functionBtn:hover) {
  background: rgba(118, 255, 3, 0.3);
}

/* iPhone 12 Pro and similar (375-414px width) */
@media (max-width: 414px) and (min-width: 375px) {
  .keyboard-wrapper {
    padding: 6px;
    min-height: 220px;
  }
  
  .keyboard-header {
    padding: 8px 12px;
  }
  
  .keyboard-input-display {
    padding: 10px;
  }
  
  .keyboard-status {
    padding: 6px 12px;
  }
}

/* Pixel 7 and similar Android devices (360-393px width) */
@media (max-width: 393px) and (min-width: 360px) {
  .keyboard-wrapper {
    padding: 4px;
    min-height: 200px;
  }
  
  .keyboard-header {
    padding: 6px 10px;
  }
  
  .keyboard-input-display {
    padding: 8px;
  }
  
  .keyboard-status {
    padding: 4px 10px;
  }
}

/* Smaller phones (320-359px width) */
@media (max-width: 359px) {
  .keyboard-wrapper {
    padding: 3px;
    min-height: 180px;
  }
  
  .keyboard-header {
    padding: 4px 8px;
  }
  
  .keyboard-input-display {
    padding: 6px;
  }
  
  .keyboard-status {
    padding: 3px 8px;
  }
}

/* Landscape orientation for mobile */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-keyboard-container {
    border-radius: 4px;
  }
  
  .keyboard-wrapper {
    min-height: 160px;
    padding: 2px;
  }
  
  .keyboard-header {
    padding: 4px 8px;
  }
  
  .keyboard-input-display {
    padding: 4px;
  }
  
  .keyboard-status {
    padding: 2px 8px;
  }
}
</style>