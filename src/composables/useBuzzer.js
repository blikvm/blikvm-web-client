/*****************************************************************************
#                                                                            #
#    blikvm                                                                  #
#                                                                            #
#    Copyright (C) 2021-present     blicube <info@blicube.com>               #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/

/**
 * useBuzzer.js
 * 
 * Composable for managing buzzer functionality
 */

import { ref, computed } from 'vue'
import { useDevice } from './useDevice'
import { useAlert } from './useAlert'
import http from '@/utils/http.js'

export function useBuzzer() {
  const { device } = useDevice()
  const { sendAlert } = useAlert()
  const isProcessing = ref(false)
  const lastBuzzTime = ref(0)

  // Buzzer configuration constants
  const BUZZ_COOLDOWN_MS = 100 // Minimum time between buzzes to prevent spam
  const DEFAULT_DURATION = 200 // Default buzz duration in milliseconds
  const DEFAULT_FREQUENCY = 1000 // Default frequency in Hz
  const BURST_DURATION = 5000 // 5-second burst duration

  // Initialize buzzer state in device if not present
  if (!device.value.buzzer) {
    device.value.buzzer = {
      available: true,
      enabled: true,
      isActive: false,
      mode: null, // 'burst', 'continuous', or null
      startTime: null
    }
  }

  // Check if buzzer is available
  const isBuzzerAvailable = computed(() => {
    return device.value?.buzzer?.available || false
  })

  // Check if buzzer is enabled
  const isBuzzerEnabled = computed(() => {
    return device.value?.buzzer?.enabled || false
  })

  // Dynamic tooltip based on buzzer state
  const buzzerTooltip = computed(() => {
    if (!device.value.buzzer.isActive) {
      return 'Click: 5-second burst | Hold: Continuous'
    }
    
    if (device.value.buzzer.mode === 'burst') {
      return 'Buzzing - Click to stop'
    }
    
    if (device.value.buzzer.mode === 'continuous') {
      return 'Continuous buzzing - Click to stop'
    }
    
    return 'Buzzer control'
  })

  /**
   * Get buzzer state from server
   */
  const getBuzzerState = async () => {
    try {
      const response = await http.get('/buzzer')
      if (response.status === 200 && response.data.code === 0) {
        if (response.data.data) {
          device.value.buzzer = {
            ...device.value.buzzer,
            ...response.data.data
          }
          console.log('Buzzer state updated:', device.value.buzzer)
        }
      } else {
        const title = 'Buzzer State'
        const message = response.data.msg || 'Failed to get buzzer state'
        sendAlert('error', title, message)
      }
    } catch (error) {
      const title = 'Buzzer State'
      const message = error.message || 'Failed to get buzzer state'
      sendAlert('error', title, message)
    }
  }

  /**
   * Send buzz command to the device
   * @param {string} mode - 'single', 'burst', or 'continuous'
   * @param {number} duration - Duration in milliseconds (default: 200)
   * @param {number} frequency - Frequency in Hz (default: 1000)
   * @returns {Promise<boolean>} - Success status
   */
  const buzz = async (mode = 'single', duration = DEFAULT_DURATION, frequency = DEFAULT_FREQUENCY) => {
    if (isProcessing.value) {
      console.warn('Buzzer: Command already in progress')
      return false
    }

    if (!isBuzzerAvailable.value) {
      console.warn('Buzzer: Not available on this device')
      return false
    }

    if (!isBuzzerEnabled.value) {
      console.warn('Buzzer: Disabled in device settings')
      return false
    }

    // Rate limiting to prevent spam
    const now = Date.now()
    if (now - lastBuzzTime.value < BUZZ_COOLDOWN_MS) {
      console.warn('Buzzer: Rate limited - too many requests')
      return false
    }

    isProcessing.value = true
    lastBuzzTime.value = now

    try {
      const response = await http.post('/buzzer', {
        mode,
        duration: Math.max(1, Math.min(10000, duration)), // Clamp between 1ms and 10s
        frequency: Math.max(100, Math.min(10000, frequency)) // Clamp between 100Hz and 10kHz
      })

      if (response.status === 200 && response.data.code === 0) {
        // Update local state
        device.value.buzzer.isActive = mode !== 'single'
        device.value.buzzer.mode = mode === 'single' ? null : mode
        device.value.buzzer.startTime = mode !== 'single' ? Date.now() : null
        
        console.log('Buzzer: Command sent successfully', response.data)
        return true
      } else {
        const title = 'Buzzer Control'
        const message = response.data.msg || 'Failed to control buzzer'
        sendAlert('error', title, message)
        return false
      }

    } catch (error) {
      const title = 'Buzzer Control'
      const message = error.message || 'Failed to control buzzer'
      sendAlert('error', title, message)
      return false
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Stop buzzer
   */
  const stopBuzzer = async () => {
    try {
      const response = await http.post('/buzzer/stop')
      if (response.status === 200 && response.data.code === 0) {
        device.value.buzzer.isActive = false
        device.value.buzzer.mode = null
        device.value.buzzer.startTime = null
        console.log('Buzzer stopped successfully')
        return true
      } else {
        const title = 'Buzzer Control'
        const message = response.data.msg || 'Failed to stop buzzer'
        sendAlert('error', title, message)
        return false
      }
    } catch (error) {
      const title = 'Buzzer Control'
      const message = error.message || 'Failed to stop buzzer'
      sendAlert('error', title, message)
      return false
    }
  }

  /**
   * Start burst mode (5-second continuous buzzing)
   */
  const startBurst = () => buzz('burst', BURST_DURATION, DEFAULT_FREQUENCY)

  /**
   * Start continuous mode (indefinite buzzing until stopped)
   */
  const startContinuous = () => buzz('continuous', 0, DEFAULT_FREQUENCY)

  /**
   * Quick buzz with default settings
   */
  const quickBuzz = () => buzz('single', DEFAULT_DURATION, DEFAULT_FREQUENCY)

  /**
   * Short beep
   */
  const beep = () => buzz('single', 100, 800)

  /**
   * Long buzz
   */
  const longBuzz = () => buzz('single', 500, 1000)

  /**
   * High pitch alert
   */
  const alert = () => buzz('single', 300, 2000)

  /**
   * Low pitch notification
   */
  const notify = () => buzz('single', 150, 600)

  /**
   * Double beep
   */
  const doubleBuzz = async () => {
    await buzz('single', 100, 1000)
    setTimeout(() => buzz('single', 100, 1000), 150)
  }

  /**
   * Triple beep
   */
  const tripleBuzz = async () => {
    await buzz('single', 100, 1000)
    setTimeout(() => buzz('single', 100, 1000), 150)
    setTimeout(() => buzz('single', 100, 1000), 300)
  }

  /**
   * Handle buzzer click - burst on click, continuous on hold
   */
  const handleBuzzerClick = () => {
    if (device.value.buzzer.isActive) {
      // Stop if currently active
      stopBuzzer()
    } else {
      // Start 5-second burst
      startBurst()
    }
  }

  /**
   * Handle buzzer mouse down for continuous mode
   */
  const handleBuzzerMouseDown = () => {
    if (!device.value.buzzer.isActive) {
      startContinuous()
    }
  }

  /**
   * Handle buzzer mouse up to stop continuous mode
   */
  const handleBuzzerMouseUp = () => {
    if (device.value.buzzer.mode === 'continuous') {
      stopBuzzer()
    }
  }

  return {
    // State
    isProcessing: computed(() => isProcessing.value),
    isBuzzerAvailable,
    isBuzzerEnabled,
    buzzerTooltip,

    // API Methods
    getBuzzerState,
    stopBuzzer,

    // Core Methods
    buzz,
    startBurst,
    startContinuous,

    // Convenience Methods
    quickBuzz,
    beep,
    longBuzz,
    alert,
    notify,
    doubleBuzz,
    tripleBuzz,

    // Interaction Handlers
    handleBuzzerClick,
    handleBuzzerMouseDown,
    handleBuzzerMouseUp,

    // Constants
    DEFAULT_DURATION,
    DEFAULT_FREQUENCY,
    BUZZ_COOLDOWN_MS,
    BURST_DURATION
  }
}