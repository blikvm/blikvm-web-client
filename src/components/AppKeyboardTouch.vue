<template>
  <div class="touch-keyboard-container">
    <!-- Keyboard Header -->
    <div v-if="showHeader" class="keyboard-header">
      <div class="keyboard-info">
        <v-icon color="#76FF03" size="small">
          mdi-keyboard
        </v-icon>
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
        :clearable="!sendDirectly"
        @click="focusKeyboard"
        @click:clear="clearInput"
      >
        <template v-if="showSendDirectly" v-slot:prepend>
          <v-checkbox
            v-model="sendDirectly"
            color="#76FF03"
            density="compact"
            hide-details
            class="send-direct-checkbox"
            v-tooltip:top="'Send text directly'"
          />
        </template>
        <template v-slot:append>
          <v-btn
            v-if="!sendDirectly && currentInput"
            size="small"
            variant="text"
            color="#FFD600"
            :loading="isSending"
            :disabled="isSending"
            @click="sendTextDirectly"
            v-tooltip:top="'Send text to remote system'"
          >
            <v-icon size="small">mdi-send</v-icon>
          </v-btn>
          
          <v-btn
            size="small"
            variant="text"
            color="#76FF03"
            @click="copyToClipboard"
            v-tooltip:top="'Copy to clipboard'"
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useKeyboardTouch } from '@/composables/useKeyboardTouch.js';
import { useClipboard } from '@/composables/useClipboard.js';
import './keyboard/touch-keyboard.css';

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
  showLanguageToggle: {
    type: Boolean,
    default: true
  },
  showCloseButton: {
    type: Boolean,
    default: false
  },
  showSendDirectly: {
    type: Boolean,
    default: true
  },
  inputPlaceholder: {
    type: String,
    default: 'Type here...'
  },
  theme: {
    type: String,
    default: 'touch-keyboard-theme'
  },
  autoFocus: {
    type: Boolean,
    default: true
  }
});


// Emits
const emit = defineEmits(['input-change', 'key-press', 'close', 'ready']);

// Composables
const touchKeyboard = useKeyboardTouch();
const { copyClipboard } = useClipboard();

// Template refs
const keyboardContainer = ref(null);

// Component state
const sendDirectly = ref(false);
const isSending = ref(false);

// Computed properties
const currentInput = computed(() => touchKeyboard.currentInput.value);
const currentLayoutName = computed(() => touchKeyboard.currentLayoutName.value);
const isInitialized = computed(() => touchKeyboard.isInitialized.value);
const isNumbersLayout = computed(() => touchKeyboard.isNumbersLayout());

// Custom key press handler that respects sendDirectly mode
const handleKeyboardPress = (button) => {
  // Always handle layout switching keys
  if (button === "{shift}" || button === "{lock}" || button === "{numbers}" || button === "{abc}") {
    touchKeyboard.onKeyPress(button);
    emit('key-press', button);
    return;
  }
  
  if (sendDirectly.value) {
    // When "Send directly" is CHECKED: Send keys immediately to server, clear text field
    touchKeyboard.onKeyPress(button);
    // Clear the accumulated text since we're sending keys directly
    nextTick(() => {
      touchKeyboard.clearInput();
    });
  } else {
    // When "Send directly" is UNCHECKED: Let text accumulate, don't send to server
    // Text will be visible in field and sent later via "Send" button
    // Do nothing here - simple-keyboard will handle text accumulation via onChange
  }
  
  emit('key-press', button);
};

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
      touchKeyboard.onInputChange(input);
      emit('input-change', input);
    },
    // Custom onKeyPress that respects sendDirectly mode
    onKeyPress: handleKeyboardPress
  };

  const success = await touchKeyboard.initializeKeyboard(keyboardContainer.value, options);
  
  if (success) {
    console.log('Touch keyboard component initialized');
    emit('ready');
    
    if (props.autoFocus) {
      focusKeyboard();
    }
  }
};

const toggleLayoutMode = () => {
  if (isNumbersLayout.value) {
    touchKeyboard.handleNumbers(); // Switch to ABC
  } else {
    touchKeyboard.handleNumbers(); // Switch to 123
  }
};

const clearInput = () => {
  touchKeyboard.clearInput();
  emit('input-change', '');
};

const focusKeyboard = () => {
  // Focus the keyboard for better touch experience
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

const sendTextDirectly = async () => {
  if (!currentInput.value || isSending.value) return;
  
  isSending.value = true;
  
  try {
    // Send each character with a small delay for reliable transmission
    for (let i = 0; i < currentInput.value.length; i++) {
      const char = currentInput.value[i];
      touchKeyboard.onKeyPress(char);
      
      // Small delay between characters for reliable transmission
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log('Text sent directly:', currentInput.value);
    
    // Clear input after successful send
    touchKeyboard.clearInput();
    emit('input-change', '');
    
  } catch (error) {
    console.error('Failed to send text directly:', error);
  } finally {
    isSending.value = false;
  }
};

// Watch for theme changes
watch(() => props.theme, (newTheme) => {
  if (isInitialized.value) {
    touchKeyboard.setTheme(newTheme);
  }
});

// Watch for sendDirectly mode changes
watch(sendDirectly, (newValue) => {
  if (newValue) {
    // When switching to "Send directly" mode, clear any accumulated text
    touchKeyboard.clearInput();
    emit('input-change', '');
  }
});

// Lifecycle
onMounted(async () => {
  await initializeKeyboard();
});

onBeforeUnmount(() => {
  touchKeyboard.destroyKeyboard();
});

// Expose methods for parent component
defineExpose({
  setInput: touchKeyboard.setInput,
  getInput: touchKeyboard.getInput,
  clearInput,
  setLayout: touchKeyboard.setLayout,
  getCurrentLayout: touchKeyboard.getCurrentLayout,
  focusKeyboard,
  isInitialized
});
</script>

<style scoped>
.touch-keyboard-container {
  background: #000000;
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

.send-direct-checkbox {
  margin: 0;
  padding: 0;
  flex: none;
}

.send-direct-checkbox :deep(.v-selection-control) {
  min-height: auto;
}

.send-direct-checkbox :deep(.v-selection-control__wrapper) {
  height: 20px;
  width: 20px;
}

.keyboard-wrapper {
  padding: 8px;
  /* Removed min-height to eliminate gap - let keyboard size naturally */
}

.keyboard-wrapper.keyboard-minimal {
  padding: 4px;
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
    /* Removed min-height to eliminate gap */
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
    /* Removed min-height to eliminate gap */
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
    /* Removed min-height to eliminate gap */
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
  .touch-keyboard-container {
    border-radius: 4px;
  }
  
  .keyboard-wrapper {
    /* Removed min-height to eliminate gap */
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