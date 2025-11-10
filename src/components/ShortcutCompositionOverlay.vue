<template>
  <!-- PiKVM-style magic key indicator with separate chips per key -->
  <div
    v-if="props.isComposing && props.isVideoVisible"
    class="magic-key-container"
    :style="overlayStyle"
  >
    <!-- Control group wrapper matching AppOverlay pattern -->
    <div class="control-group">
      <!-- Magic key status chip -->
      <v-chip
        color="#76FF03"
        variant="tonal"
        size="small"
        class="magic-status-chip"
      >
        <v-icon
          color="#76FF03"
          size="14"
        >
          mdi-keyboard-outline
        </v-icon>
      </v-chip>

      <!-- Individual key chips with + separators -->
      <template v-for="(key, index) in getIndividualKeys()" :key="`key-${index}-${key}`">
        <span v-if="index > 0" class="key-separator">+</span>
        <v-chip
          :color="getKeyChipColor(key)"
          variant="tonal"
          size="small"
          class="key-chip"
        >
          {{ key }}
        </v-chip>
      </template>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue';
  import { zIndex } from '@/styles/zIndex';
  
  // Accept magic key state as props instead of calling useMagicKey() directly
  const props = defineProps({
    isComposing: {
      type: Boolean,
      default: false
    },
    displayText: {
      type: String,
      default: ''
    },
    currentKeys: {
      type: Array,
      default: () => []
    },
    magicKey: {
      type: String,
      default: 'ScrollLock'
    },
    isDrawerVisible: {
      type: Boolean,
      default: false
    },
    isVideoVisible: {
      type: Boolean,
      default: false
    },
    videoBounds: {
      type: Object,
      default: () => ({ top: 0, left: 0, width: 0, height: 0 })
    },
  });


  // Format individual keys for display
  const getIndividualKeys = () => {
    if (!props.isComposing || props.currentKeys.length === 0) {
      return [];
    }
    
    return props.currentKeys.map(key => formatSingleKey(key));
  };

  // Format a single key for display
  const formatSingleKey = (key) => {
    const keyNames = {
      'ControlLeft': 'Ctrl',
      'ControlRight': 'Ctrl',
      'ShiftLeft': 'Shift',
      'ShiftRight': 'Shift',
      'AltLeft': 'Alt',
      'AltRight': 'Alt',
      'MetaLeft': 'Cmd',
      'MetaRight': 'Cmd',
      'Enter': '⏎',
      'Escape': 'Esc',
      'Space': 'Space',
      'Tab': 'Tab',
      'Backspace': '⌫',
      'Delete': 'Del',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→'
    };

    if (keyNames[key]) return keyNames[key];
    if (key.startsWith('Key')) return key.replace('Key', '');
    if (key.startsWith('Digit')) return key.replace('Digit', '');
    if (key.startsWith('F') && /F\d+/.test(key)) return key;
    return key;
  };

  // Get color for individual key chips - BliKVM design system
  const getKeyChipColor = (key) => {
    // All keys use BliKVM lime green - consistent with app design
    return '#76FF03'; // BliKVM primary color for all keys
  };

  // Calculate position relative to video bounds (similar to AppOverlay)
  const overlayStyle = computed(() => {
    const bounds = props.videoBounds;
    const DEFAULT_TOP_MARGIN = 20; // Same as AppOverlay
    const DEFAULT_LEFT_MARGIN = 20;
    
    return {
      position: 'fixed',
      left: `${bounds.left + DEFAULT_LEFT_MARGIN}px`,
      top: `${bounds.top + DEFAULT_TOP_MARGIN}px`,
      zIndex: zIndex.overlay
    };
  });
  
</script>

<style scoped>
  .magic-key-container {
    /* Position now handled by computed overlayStyle */
  }

  /* Control group styling matching AppOverlay pattern */
  .control-group {
    backdrop-filter: blur(4px);
    border-radius: 8px;
    padding: 6px 12px;
    margin: 0 4px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    background: rgba(0, 0, 0, 0.6) !important;
  }

  .magic-status-chip {
    background: rgba(118, 255, 3, 0.15) !important;
  }

  .key-chip {
    font-family: 'Roboto Mono', monospace !important;
    font-weight: 600 !important;
    min-width: 40px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
  }

  .key-separator {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    font-weight: 500;
    margin: 0 2px;
  }


</style>