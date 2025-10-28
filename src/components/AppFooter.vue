<template>
  <!-- Unified single footer with toggle navigation -->
  <v-footer
    v-if="shouldShowFooter"
    class="d-flex flex-column pa-0 bg-black"
  >
    <!-- Content sections with proper ordering: Virtual Mouse → Notifications → Terminals → Keyboard -->
    <div v-if="hasActiveComponents">
      <!-- Virtual Mouse Section -->
      <AppFooterVirtualMouse :show-virtual-mouse="showVirtualMouse" />

      <!-- Notifications Section -->
      <AppFooterNotifications :show-notifications="showNotifications" />

      <!-- Terminal Section -->
      <AppFooterTerminals
        :showSSHTerminal="showSSHTerminal"
        :showSerial="showSerial"
        :settings="settings"
      />


      <!-- Desktop Keyboard Section -->
      <AppFooterDesktopKeyboard
        :show-keyboard="showKeyboard"
        :is-experimental="isExperimental"
        :device="device"
        :handle-key-press="handleKeyPress"
        :handle-key-released="handleKeyReleased"
      />

      <!-- Macro Manager Section -->
      <div v-if="showMacroManager" class="macro-manager-section">
        <MacroRecording />
      </div>

      <!-- Macro Recording Studio Section -->
      <div v-if="showMacroPlayback" class="macro-recording-studio-section">
        <MacroRecordingStudio />
      </div>

    </div>

    <!-- Navigation bar -->
    <AppFooterNavigation
      :footer="footer"
      :active-toggle="activeToggle"
      :device="device"
      :lock-states="lockStates"
      :is-touch-device="isTouchDevice"
      :handle-toggle-change="handleToggleChange"
      :toggle-pin="togglePin"
    />
  </v-footer>

  <!-- Macro Recording Overlay -->
  <MacroOverlay 
    :show-macro-overlay="showMacroOverlay"
    @close="closeMacroOverlay"
  />
</template>

<script setup>
import { computed, watch, onMounted, ref } from 'vue'
import { useAppStore } from "@/stores/stores"
import { storeToRefs } from "pinia"
import { useDevice } from "@/composables/useDevice"
import { useKeyboard } from "@/composables/useKeyboard-new"
import { useFooterToggle } from "@/composables/useFooterToggle"
import { useComponentVisibility } from "@/composables/useComponentVisibility"
import { useLockStates } from "@/composables/useLockStates"

// Component imports
import AppFooterVirtualMouse from "@/components/footer/AppFooterVirtualMouse.vue"
import AppFooterNotifications from "@/components/footer/AppFooterNotifications.vue"
import AppFooterTerminals from "@/components/footer/AppFooterTerminals.vue"
import AppFooterDesktopKeyboard from "@/components/footer/AppFooterDesktopKeyboard.vue"
import AppFooterNavigation from "@/components/footer/AppFooterNavigation.vue"
import MacroOverlay from "@/components/MacroOverlay.vue"
import MacroRecording from "@/components/MacroRecording.vue"
import MacroRecordingStudio from "@/components/MacroRecordingStudio.vue"

// Composables and stores
const store = useAppStore()
const { device } = useDevice()
const { isExperimental, footer, isTouchDevice, settings } = storeToRefs(store)
const { handleKeyPress, handleKeyReleased } = useKeyboard(device.value.ws)

// Footer toggle functionality with proper mutual exclusivity - video always active
const { activeToggle, handleToggleChange: handleFooterToggleChange, showMacroOverlay, closeMacroOverlay } = useFooterToggle(["video"])

// Business logic composables  
const { lockStates } = useLockStates(device)

// Store previous state to detect changes
const previousToggleState = ref([...activeToggle.value])

// Component visibility management with business rules
const {
  showKeyboard,
  showMobileKeyboard,
  showVirtualMouse,
  showSerial,
  showNotifications,
  updateVisibility,
  watchToggleChanges
} = useComponentVisibility(device, isTouchDevice)

// Computed properties
const showSSHTerminal = computed(() => device.value.showSSHTerminal)
const showMacroManager = computed(() => activeToggle.value.includes('macro-manager'))
const showMacroPlayback = computed(() => activeToggle.value.includes('macro-playback'))

// Update store macro interface state when toggles change
watch([showMacroManager, showMacroPlayback], ([manager, playback]) => {
  store.macro.showInterface = manager || playback
}, { immediate: true })

const hasActiveComponents = computed(() => 
  showKeyboard.value || showMobileKeyboard.value || showVirtualMouse.value || showSSHTerminal.value || showSerial.value || showNotifications.value || showMacroManager.value || showMacroPlayback.value
)

const shouldShowFooter = computed(() => 
  hasActiveComponents.value || footer.value.showFooter || footer.value.pinnedFooter
)

// Business rules for component exclusions
const EXCLUSION_RULES = {
  // Notifications exclude keyboard (mutual exclusion)
  notifications: ['keyboard'],
  // Keyboards exclude notifications only (mutual exclusion)
  keyboard: ['notifications'],
  
  // No other exclusions - terminals and mouse can coexist with everything
}

// Business logic functions
function applyExclusionRules(activeComponent) {
  const exclusions = EXCLUSION_RULES[activeComponent] || []
  exclusions.forEach(component => {
    // Remove the excluded component from the active toggle
    const currentToggle = [...activeToggle.value]
    const filteredToggle = currentToggle.filter(item => item !== component)
    if (filteredToggle.length !== currentToggle.length) {
      activeToggle.value = filteredToggle
    }
  })
}

function toggleComponent(componentId) {
  const currentToggle = [...activeToggle.value]
  const isCurrentlyActive = currentToggle.includes(componentId)
  
  if (isCurrentlyActive) {
    // Turn off the component
    activeToggle.value = currentToggle.filter(item => item !== componentId)
  } else {
    // Turn on the component and apply exclusion rules
    activeToggle.value = [...currentToggle, componentId]
    applyExclusionRules(componentId)
  }
  
  // Update visibility after toggle change
  updateVisibility(activeToggle.value)
}

function handleToggleChange(newToggles) {
  // Business rules: mutual exclusions
  // 1. notifications vs (keyboard, console, serial) 
  // 2. keyboard vs (console, serial)
  // 3. video is display-only, cannot be toggled by user
  // Rule: newest clicked component wins, hides all conflicting ones
  
  const interactiveComponents = ['keyboard', 'console', 'serial', 'notifications', 'macro-manager', 'macro-playback']
  const newItem = newToggles.find(item => !previousToggleState.value.includes(item))
  
  // If user clicked video, ignore it (video is controlled by video state, not user)
  if (newItem === 'video') {
    // Restore previous state - video toggle is display-only
    activeToggle.value = previousToggleState.value
    return
  }
  
  // Special handling for macro components - they take full screen, hide everything else
  if (newItem === 'macro-manager') {
    newToggles = ['video', 'macro-manager'] // Only keep video and macro-manager
  } else if (newItem === 'macro-playback') {
    newToggles = ['video', 'macro-playback'] // Only keep video and macro-playback
  }
  
  if (interactiveComponents.includes(newItem)) {
    // User clicked an interactive component, apply exclusions
    if (newItem === 'notifications') {
      // Notifications clicked - remove keyboard, console, serial
      newToggles = newToggles.filter(item => !['keyboard', 'console', 'serial'].includes(item))
    } else if (newItem === 'keyboard') {
      // Keyboard clicked - remove notifications, console, serial  
      newToggles = newToggles.filter(item => !['notifications', 'console', 'serial'].includes(item))
    } else if (newItem === 'console' || newItem === 'serial') {
      // Terminal clicked - remove notifications and keyboard
      newToggles = newToggles.filter(item => !['notifications', 'keyboard'].includes(item))
    }
  }
  
  // Update previous state for next time
  previousToggleState.value = [...newToggles]
  
  activeToggle.value = newToggles
  handleFooterToggleChange(newToggles)
  updateVisibility(newToggles)
}

function togglePin() {
  footer.value.pinnedFooter = !footer.value.pinnedFooter
  if (footer.value.pinnedFooter) {
    footer.value.showFooter = true // Keep menu visible when pinned
  }
}

// State synchronization with device store
watch(() => device.value.showSSHTerminal, (newValue) => {
  // Sync the SSH terminal state with the toggle
  const currentToggle = [...activeToggle.value]
  const hasConsole = currentToggle.includes('console')
  
  if (newValue && !hasConsole) {
    activeToggle.value = [...currentToggle, 'console']
  } else if (!newValue && hasConsole) {
    activeToggle.value = currentToggle.filter(item => item !== 'console')
  }
}, { immediate: true })

// Ensure video is always in the toggle (read-only/always active)
watch(activeToggle, (newToggle) => {
  if (!newToggle.includes('video')) {
    activeToggle.value = [...newToggle, 'video']
  }
}, { immediate: true })

// Setup component visibility watcher
watchToggleChanges(activeToggle)


// Component lifecycle
onMounted(() => {
  if (typeof window !== 'undefined') {
    isTouchDevice.value =
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0);
  }
})
</script>

<style scoped>
/* Minimal styles for main AppFooter component */

.macro-manager-section,
.macro-recording-studio-section {
  max-height: 70vh;
  overflow-y: auto;
  width: 100%;
  position: relative;
}

/* Ensure these sections don't break out of footer bounds */
.macro-recording-studio-section {
  background-color: #1a1a1a;
  border-top: 1px solid #333;
}
</style>