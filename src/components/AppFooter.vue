<template>
  <!-- Unified single footer with toggle navigation -->
  <v-footer
    v-if="shouldShowFooter"
    class="d-flex flex-column pa-0 bg-black"
  >
    <!-- Content sections -->
    <div v-if="hasActiveComponents">

      <!-- Virtual Mouse Section -->
      <AppFooterVirtualMouse :show-virtual-mouse="showVirtualMouse" />

      <!-- Desktop Keyboard Section -->
      <AppFooterDesktopKeyboard
        v-if="!isTouchDevice"
        :show-keyboard="showKeyboard"
        :is-experimental="isExperimental"
        :device="device"
        :handle-key-press="handleKeyPress"
        :handle-key-released="handleKeyReleased"
      />

      <!-- Terminal Section -->
      <AppFooterTerminals
        :showSSHTerminal="showSSHTerminal"
        :showSerial="showSerial"
        :settings="settings"
        :is-touch-device="isTouchDevice"
      />

      <!-- Notifications Section -->
      <AppFooterNotifications :show-notifications="showNotifications" />
    </div>

    <!-- Touch Keyboard Section -->
    <div v-if="showTouchKeyboard">
      <AppTouchKeyboard :show-header="false" />
    </div>

    <!-- Navigation bar -->
    <div class="position-relative w-100" style="height: 40px;">
      <AppFooterNavigation
        :footer="footer"
        :active-toggle="activeToggle"
        :device="device"
        :lock-states="lockStates"
        :is-touch-device="isTouchDevice"
        :handle-toggle-change="handleToggleChange"
        :handle-layout-click="handleLayoutClick"
      />
      
      <div v-if="!isTouchDevice" class="position-absolute d-flex align-center" style="right: 16px; top: 50%; transform: translateY(-50%);">
        <LockStateIndicators 
          :device="device"
          :lock-states="lockStates"
          :is-touch-device="isTouchDevice"
        />
        &nbsp;
      </div>
    </div>
  </v-footer>
</template>

<script setup>
import { computed, watch, onMounted, ref } from 'vue'
import { useAppStore } from "@/stores/stores"
import { storeToRefs } from "pinia"
import { useDevice } from "@/composables/useDevice"
import { useKeyboard } from "@/composables/useKeyboard"
import { useFooterToggle } from "@/composables/useFooterToggle"
import { useComponentVisibility } from "@/composables/useComponentVisibility"
import { useLockStates } from "@/composables/useLockStates"
import { useHeaderMenu } from "@/composables/useHeaderMenu"

// Component imports
import AppFooterNavigation from "@/components/footer/AppFooterNavigation.vue"
import AppFooterDesktopKeyboard from "@/components/footer/AppFooterDesktopKeyboard.vue"
import AppTouchKeyboard from "@/components/AppKeyboardTouch.vue"
import AppFooterVirtualMouse from "@/components/footer/AppFooterVirtualMouse.vue"
import AppFooterTerminals from "@/components/footer/AppFooterTerminals.vue"
import AppFooterNotifications from "@/components/footer/AppFooterNotifications.vue"
import LockStateIndicators from "@/components/footer/LockStateIndicators.vue"

// Composables and stores
const store = useAppStore()
const { device } = useDevice()
const { isExperimental, footer, isTouchDevice, settings } = storeToRefs(store)
const { handleKeyPress, handleKeyReleased } = useKeyboard(device.value.ws)

// Footer toggle functionality with proper mutual exclusivity - video always active
const { activeToggle, handleToggleChange: handleFooterToggleChange } = useFooterToggle(["video"])

// Business logic composables  
const { lockStates } = useLockStates(device)
const { handleLayoutClick } = useHeaderMenu()

// Store previous state to detect changes
const previousToggleState = ref([...activeToggle.value])


// Component visibility management with business rules
const {
  showKeyboard,
  showTouchKeyboard,
  showVirtualMouse,
  showSerial,
  showNotifications,
  updateVisibility,
  watchToggleChanges
} = useComponentVisibility(device, isTouchDevice)

// Computed properties
const showSSHTerminal = computed(() => device.value.showSSHTerminal)

const hasActiveComponents = computed(() => 
  showKeyboard.value || showTouchKeyboard.value || showVirtualMouse.value || showSSHTerminal.value || showSerial.value || showNotifications.value
)

const shouldShowFooter = computed(() => 
  footer.value.showFooter
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
  // 4. Touch devices: console vs serial (mutually exclusive)
  // Rule: newest clicked component wins, hides all conflicting ones
  
  const interactiveComponents = ['keyboard', 'console', 'serial', 'notifications']
  const newItem = newToggles.find(item => !previousToggleState.value.includes(item))
  
  // If user clicked video, ignore it (video is controlled by video state, not user)
  if (newItem === 'video') {
    // Restore previous state - video toggle is display-only
    activeToggle.value = previousToggleState.value
    return
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
      
      // Touch devices: terminals are mutually exclusive
      if (isTouchDevice.value) {
        if (newItem === 'console') {
          // Console clicked - remove serial
          newToggles = newToggles.filter(item => item !== 'serial')
        } else if (newItem === 'serial') {
          // Serial clicked - remove console
          newToggles = newToggles.filter(item => item !== 'console')
        }
      }
    }
  }
  
  // Update previous state for next time
  previousToggleState.value = [...newToggles]
  
  activeToggle.value = newToggles
  handleFooterToggleChange(newToggles)
  updateVisibility(newToggles)
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
</style>