<template>
  <div class="keyboard-test-container">
    <v-card class="mx-auto" max-width="800">
      <v-card-title class="d-flex align-center">
        <v-icon color="#76FF03" class="mr-2">mdi-keyboard-variant</v-icon>
        Keyboard Testing Interface
      </v-card-title>
      
      <v-card-text>
        <!-- Keyboard Manager Controls -->
        <div class="mb-4">
          <h3 class="text-h6 mb-2">Keyboard Manager</h3>
          
          <v-row dense>
            <v-col cols="auto">
              <v-select
                v-model="selectedKeyboardType"
                :items="keyboardTypes"
                item-title="label"
                item-value="value"
                label="Keyboard Type"
                density="compact"
                variant="outlined"
                color="#76FF03"
                @update:model-value="switchKeyboard"
              />
            </v-col>
            
            <v-col cols="auto">
              <v-btn
                :color="isKeyboardVisible ? '#D32F2F' : '#76FF03'"
                variant="outlined"
                @click="toggleKeyboard"
              >
                {{ isKeyboardVisible ? 'Hide' : 'Show' }} Keyboard
              </v-btn>
            </v-col>
            
            <v-col cols="auto">
              <v-chip
                :color="isKeyboardInitialized ? '#76FF03' : '#D32F2F'"
                size="small"
              >
                {{ isKeyboardInitialized ? 'Initialized' : 'Not Ready' }}
              </v-chip>
            </v-col>
          </v-row>
        </div>

        <!-- Current Input Display -->
        <div class="mb-4">
          <h3 class="text-h6 mb-2">Current Input</h3>
          <v-textarea
            v-model="currentInputText"
            label="Keyboard Output"
            variant="outlined"
            color="#76FF03"
            rows="3"
            readonly
            :placeholder="inputPlaceholder"
          />
          
          <div class="d-flex gap-2 mt-2">
            <v-btn
              size="small"
              variant="outlined"
              color="#76FF03"
              @click="clearInput"
            >
              Clear Input
            </v-btn>
            
            <v-btn
              size="small"
              variant="outlined"
              color="#76FF03"
              @click="copyInput"
            >
              Copy Input
            </v-btn>
          </div>
        </div>

        <!-- Keyboard Capabilities -->
        <div class="mb-4">
          <h3 class="text-h6 mb-2">Current Keyboard Capabilities</h3>
          <div class="capabilities-grid">
            <v-chip
              v-for="(value, key) in capabilities"
              :key="key"
              size="small"
              :color="value ? '#76FF03' : 'grey'"
              class="ma-1"
            >
              {{ formatCapabilityName(key) }}: {{ value ? 'Yes' : 'No' }}
            </v-chip>
          </div>
          
          <!-- Language Selection for International Keyboard -->
          <div v-if="capabilities.hasLanguages && selectedKeyboardType === 'international'" class="mt-3">
            <v-select
              v-model="selectedLanguage"
              :items="availableLanguages"
              item-title="name"
              item-value="code"
              label="Language"
              density="compact"
              variant="outlined"
              color="#76FF03"
              @update:model-value="switchLanguage"
            />
          </div>
        </div>

        <!-- Event Log -->
        <div class="mb-4">
          <h3 class="text-h6 mb-2">Event Log</h3>
          <v-sheet
            color="black"
            class="event-log pa-3"
            max-height="200"
            style="overflow-y: auto;"
          >
            <div
              v-for="(event, index) in eventLog"
              :key="index"
              class="event-item text-caption"
              :class="getEventClass(event.type)"
            >
              <span class="event-time">[{{ event.time }}]</span>
              <span class="event-type">{{ event.type }}:</span>
              <span class="event-data">{{ event.data }}</span>
            </div>
            <div v-if="eventLog.length === 0" class="text-center text-medium-emphasis">
              No events yet...
            </div>
          </v-sheet>
          
          <v-btn
            size="small"
            variant="text"
            color="#76FF03"
            @click="clearEventLog"
            class="mt-2"
          >
            Clear Log
          </v-btn>
        </div>

        <!-- Mobile Keyboard Component Test -->
        <div v-if="selectedKeyboardType === 'mobile' && isKeyboardVisible">
          <h3 class="text-h6 mb-2">Mobile Keyboard Component</h3>
          <MobileKeyboard
            :show-header="true"
            :show-input-display="true"
            :show-status-bar="true"
            :show-close-button="true"
            input-placeholder="Mobile keyboard test..."
            @input-change="onMobileInputChange"
            @key-press="onMobileKeyPress"
            @ready="onMobileKeyboardReady"
            @close="onMobileKeyboardClose"
          />
        </div>

        <!-- Keyboard Container for Manager -->
        <div v-else-if="isKeyboardVisible" class="keyboard-container">
          <h3 class="text-h6 mb-2">{{ selectedKeyboardType.charAt(0).toUpperCase() + selectedKeyboardType.slice(1) }} Keyboard</h3>
          <div 
            ref="keyboardContainer" 
            class="keyboard-wrapper"
          />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useKeyboardManager } from '@/composables/keyboards/useKeyboardManager.js';
import { useClipboard } from '@/composables/useClipboard.js';
import MobileKeyboard from './MobileKeyboard.vue';

// Composables
const keyboardManager = useKeyboardManager();
const { copyClipboard } = useClipboard();

// Template refs
const keyboardContainer = ref(null);

// Component state
const selectedKeyboardType = ref('mobile');
const selectedLanguage = ref('en');
const eventLog = ref([]);
const currentInputText = ref('');

// Keyboard types for selection
const keyboardTypes = [
  { label: 'Mobile Keyboard', value: 'mobile' },
  { label: 'International Keyboard', value: 'international' },
];

// Computed properties
const isKeyboardVisible = computed(() => keyboardManager.isKeyboardVisible.value);
const isKeyboardInitialized = computed(() => keyboardManager.isCurrentKeyboardInitialized.value);
const capabilities = computed(() => keyboardManager.getKeyboardCapabilities());
const availableLanguages = computed(() => {
  const keyboard = keyboardManager.getCurrentKeyboard.value;
  return keyboard?.getAvailableLanguages?.() || [];
});

const inputPlaceholder = computed(() => {
  return `Type using ${selectedKeyboardType.value} keyboard...`;
});

// Methods
const addEvent = (type, data) => {
  const time = new Date().toLocaleTimeString();
  eventLog.value.unshift({ type, data, time });
  
  // Keep only last 50 events
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50);
  }
};

const switchKeyboard = async (type) => {
  addEvent('SWITCH', `Switching to ${type} keyboard`);
  
  const success = await keyboardManager.switchKeyboardType(type);
  if (success) {
    selectedKeyboardType.value = type;
    currentInputText.value = '';
    addEvent('SUCCESS', `Switched to ${type} keyboard`);
  } else {
    addEvent('ERROR', `Failed to switch to ${type} keyboard`);
  }
};

const toggleKeyboard = async () => {
  if (selectedKeyboardType.value === 'mobile') {
    // Mobile keyboard is handled by component
    keyboardManager.isKeyboardVisible.value = !keyboardManager.isKeyboardVisible.value;
    addEvent('TOGGLE', `Mobile keyboard ${keyboardManager.isKeyboardVisible.value ? 'shown' : 'hidden'}`);
    return;
  }

  const success = await keyboardManager.toggleKeyboard(keyboardContainer.value);
  const action = isKeyboardVisible.value ? 'shown' : 'hidden';
  
  if (success) {
    addEvent('TOGGLE', `Keyboard ${action}`);
  } else {
    addEvent('ERROR', `Failed to ${action} keyboard`);
  }
};

const clearInput = () => {
  currentInputText.value = '';
  keyboardManager.clearInput();
  addEvent('CLEAR', 'Input cleared');
};

const copyInput = async () => {
  if (currentInputText.value) {
    try {
      await copyClipboard(currentInputText.value);
      addEvent('COPY', 'Input copied to clipboard');
    } catch (error) {
      addEvent('ERROR', 'Failed to copy to clipboard');
    }
  }
};

const switchLanguage = async (languageCode) => {
  const keyboard = keyboardManager.getCurrentKeyboard.value;
  if (keyboard?.switchLanguage) {
    const success = await keyboard.switchLanguage(languageCode);
    if (success) {
      addEvent('LANGUAGE', `Switched to ${languageCode}`);
    } else {
      addEvent('ERROR', `Failed to switch to ${languageCode}`);
    }
  }
};

const clearEventLog = () => {
  eventLog.value = [];
};

const formatCapabilityName = (key) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

const getEventClass = (type) => {
  switch (type) {
    case 'ERROR':
      return 'event-error';
    case 'SUCCESS':
      return 'event-success';
    case 'INPUT':
      return 'event-input';
    case 'KEY':
      return 'event-key';
    default:
      return 'event-default';
  }
};

// Mobile keyboard event handlers
const onMobileInputChange = (input) => {
  currentInputText.value = input;
  addEvent('INPUT', `Input changed: "${input}"`);
};

const onMobileKeyPress = (button) => {
  addEvent('KEY', `Key pressed: ${button}`);
};

const onMobileKeyboardReady = () => {
  addEvent('SUCCESS', 'Mobile keyboard ready');
};

const onMobileKeyboardClose = () => {
  keyboardManager.isKeyboardVisible.value = false;
  addEvent('TOGGLE', 'Mobile keyboard closed');
};

// Setup keyboard manager input watching
const setupInputWatcher = () => {
  // Watch for input changes from keyboard manager
  setInterval(() => {
    const managerInput = keyboardManager.getCurrentInput();
    if (managerInput !== currentInputText.value && selectedKeyboardType.value !== 'mobile') {
      currentInputText.value = managerInput;
    }
  }, 100);
};

// Lifecycle
onMounted(() => {
  addEvent('INIT', 'Keyboard test interface initialized');
  setupInputWatcher();
});
</script>

<style scoped>
.keyboard-test-container {
  padding: 16px;
  background: #000000;
  min-height: 100vh;
}

.capabilities-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.keyboard-wrapper {
  min-height: 250px;
  border: 1px solid rgba(118, 255, 3, 0.3);
  border-radius: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
}

.event-log {
  border: 1px solid rgba(118, 255, 3, 0.3);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
}

.event-item {
  margin-bottom: 4px;
  display: flex;
  gap: 8px;
}

.event-time {
  color: #76FF03;
  font-weight: 500;
}

.event-type {
  font-weight: 600;
  min-width: 60px;
}

.event-error {
  color: #D32F2F;
}

.event-success {
  color: #76FF03;
}

.event-input {
  color: #42A5F5;
}

.event-key {
  color: #FFD600;
}

.event-default {
  color: #ffffff;
}
</style>