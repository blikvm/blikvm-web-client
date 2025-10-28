import { ref } from 'vue'
import http from '@/utils/http'

export function useMacroRecorder() {
  const isRecording = ref(false)
  const isRunning = ref(false)
  const macros = ref([])
  const currentMacro = ref(null)

  // Start recording a new macro
  const startRecording = async () => {
    try {
      await http.post('/recorder/start')
      isRecording.value = true
      console.log('Macro recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  // Stop recording the current macro
  const stopRecording = async () => {
    try {
      await http.post('/recorder/stop')
      isRecording.value = false
      console.log('Macro recording stopped')
      // Refresh macro list
      await loadMacros()
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }
  }

  // Run a specific macro
  const runMacro = async (macroName) => {
    try {
      isRunning.value = true
      await http.post(`/recorder/run/${macroName}`)
      console.log(`Macro ${macroName} executed`)
    } catch (error) {
      console.error(`Failed to run macro ${macroName}:`, error)
    } finally {
      isRunning.value = false
    }
  }

  // Stop currently running macro
  const stopMacro = async () => {
    try {
      await http.post('/recorder/run/stop')
      isRunning.value = false
      console.log('Macro execution stopped')
    } catch (error) {
      console.error('Failed to stop macro execution:', error)
    }
  }

  // Delete a macro
  const deleteMacro = async (macroName) => {
    try {
      await http.delete(`/recorder/${macroName}`)
      console.log(`Macro ${macroName} deleted`)
      // Refresh macro list
      await loadMacros()
    } catch (error) {
      console.error(`Failed to delete macro ${macroName}:`, error)
    }
  }

  // Save/update a macro
  const saveMacro = async (macroName, macroData) => {
    try {
      await http.post(`/recorder/${macroName}`, macroData)
      console.log(`Macro ${macroName} saved`)
      // Refresh macro list
      await loadMacros()
    } catch (error) {
      console.error(`Failed to save macro ${macroName}:`, error)
    }
  }

  // Download a macro file
  const downloadMacro = async (macroName) => {
    try {
      const response = await http.get(`/recorder/download/${macroName}`, {
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${macroName}.macro`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      console.log(`Macro ${macroName} downloaded`)
    } catch (error) {
      console.error(`Failed to download macro ${macroName}:`, error)
    }
  }

  // Load all available macros
  const loadMacros = async () => {
    try {
      const response = await http.get('/recorder')
      macros.value = response.data || []
      console.log('Macros loaded:', macros.value)
    } catch (error) {
      console.error('Failed to load macros:', error)
      macros.value = []
    }
  }

  return {
    // State
    isRecording,
    isRunning,
    macros,
    currentMacro,
    
    // Actions
    startRecording,
    stopRecording,
    runMacro,
    stopMacro,
    deleteMacro,
    saveMacro,
    downloadMacro,
    loadMacros
  }
}