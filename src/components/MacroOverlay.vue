<template>
  <div 
    v-if="showMacroOverlay" 
    class="macro-overlay"
    :style="{ zIndex: 800 }"
  >
    <v-card class="macro-card" elevation="8">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Macro Recording</span>
        <v-btn 
          icon 
          size="small" 
          @click="closeMacroOverlay"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <!-- Recording Status -->
        <div v-if="isRecording" class="recording-status mb-3">
          <v-chip color="error" class="pulse">
            <v-icon left>mdi-record</v-icon>
            Recording...
          </v-chip>
        </div>

        <!-- Playback Status -->
        <div v-if="isRunning" class="playback-status mb-3">
          <v-chip color="success">
            <v-icon left>mdi-play</v-icon>
            Playing: {{ currentMacroName }}
          </v-chip>
          <v-progress-linear 
            v-if="playbackProgress >= 0"
            :model-value="playbackProgress" 
            class="mt-2"
          />
        </div>

        <!-- Recording Controls -->
        <v-row dense class="mb-3">
          <v-col>
            <v-btn
              :disabled="isRecording || isRunning"
              @click="startRecording"
              color="success"
              block
            >
              <v-icon left>mdi-record</v-icon>
              Start Recording
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              :disabled="!isRecording"
              @click="stopRecording"
              color="error"
              block
            >
              <v-icon left>mdi-stop</v-icon>
              Stop Recording
            </v-btn>
          </v-col>
        </v-row>

        <!-- Macro Selection -->
        <v-row dense class="mb-3">
          <v-col>
            <v-select
              v-model="selectedMacro"
              :items="macroItems"
              label="Select Macro"
              :disabled="isRecording || isRunning"
              clearable
            />
          </v-col>
        </v-row>

        <!-- Playback Controls -->
        <v-row dense>
          <v-col>
            <v-btn
              :disabled="!selectedMacro || isRecording || isRunning"
              @click="runSelectedMacro"
              color="primary"
              block
            >
              <v-icon left>mdi-play</v-icon>
              Run Macro
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              :disabled="!isRunning"
              @click="stopMacro"
              color="warning"
              block
            >
              <v-icon left>mdi-stop</v-icon>
              Stop Playback
            </v-btn>
          </v-col>
        </v-row>

        <!-- Quick Actions -->
        <v-row dense class="mt-2">
          <v-col>
            <v-btn
              :disabled="!selectedMacro"
              @click="deleteMacro(selectedMacro)"
              color="error"
              variant="outlined"
              size="small"
            >
              <v-icon left>mdi-delete</v-icon>
              Delete
            </v-btn>
          </v-col>
          <v-col>
            <v-btn
              :disabled="!selectedMacro"
              @click="downloadMacro(selectedMacro)"
              color="info"
              variant="outlined"
              size="small"
            >
              <v-icon left>mdi-download</v-icon>
              Download
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useMacroRecorder } from '@/composables/useMacroRecorder'
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'MacroOverlay',
  props: {
    showMacroOverlay: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const {
      isRecording,
      isRunning,
      macros,
      startRecording,
      stopRecording,
      runMacro,
      stopMacro,
      deleteMacro,
      downloadMacro,
      loadMacros
    } = useMacroRecorder()

    const closeMacroOverlay = () => {
      emit('close')
    }
    
    const selectedMacro = ref(null)
    const currentMacroName = ref('')
    const playbackProgress = ref(-1)

    // Computed property for macro dropdown items
    const macroItems = computed(() => {
      if (!Array.isArray(macros.value)) {
        return []
      }
      return macros.value.map(macro => ({
        title: macro.name,
        value: macro.name
      }))
    })

    // Run selected macro
    const runSelectedMacro = async () => {
      if (selectedMacro.value) {
        currentMacroName.value = selectedMacro.value
        playbackProgress.value = 0
        await runMacro(selectedMacro.value)
        playbackProgress.value = -1
        currentMacroName.value = ''
      }
    }

    // Load macros on mount
    onMounted(() => {
      loadMacros()
    })

    return {
      // State
      isRecording,
      isRunning,
      macros,
      selectedMacro,
      currentMacroName,
      playbackProgress,
      
      // Computed
      macroItems,
      
      // Methods
      startRecording,
      stopRecording,
      runSelectedMacro,
      stopMacro,
      deleteMacro,
      downloadMacro,
      closeMacroOverlay
    }
  }
}
</script>

<style scoped>
.macro-overlay {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 350px;
  pointer-events: auto;
}

.macro-card {
  background: rgba(0, 0, 0, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.recording-status .pulse {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.playback-status {
  text-align: center;
}
</style>