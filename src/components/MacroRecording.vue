<template>
  <v-container fluid class="macro-recording pa-4">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-record-rec</v-icon>
            Macro Recording
          </v-card-title>
          
          <v-card-text>
            <!-- Recording Section -->
            <v-row class="mb-4">
              <v-col cols="12">
                <h3 class="mb-3">Recording Controls</h3>
                <v-row>
                  <v-col cols="auto">
                    <v-btn
                      :disabled="isRecording || isRunning"
                      @click="startRecording"
                      color="success"
                      size="large"
                    >
                      <v-icon left>mdi-record</v-icon>
                      Start Recording
                    </v-btn>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn
                      :disabled="!isRecording"
                      @click="stopRecording"
                      color="error"
                      size="large"
                    >
                      <v-icon left>mdi-stop</v-icon>
                      Stop Recording
                    </v-btn>
                  </v-col>
                  <v-col cols="auto" v-if="isRecording">
                    <v-chip color="error" class="pulse">
                      <v-icon left>mdi-record</v-icon>
                      Recording in progress...
                    </v-chip>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <!-- Macro Management Section -->
            <v-row class="mb-4">
              <v-col cols="12">
                <h3 class="mb-3">Saved Macros</h3>
                
                <!-- Macro List -->
                <v-data-table
                  :headers="headers"
                  :items="macrosList"
                  :loading="loading"
                  class="elevation-1"
                  no-data-text="No macros recorded yet"
                >
                  <template v-slot:item.actions="{ item }">
                    <v-btn
                      icon
                      size="small"
                      @click="runMacro(item.name)"
                      :disabled="isRecording || isRunning"
                      color="primary"
                    >
                      <v-icon>mdi-play</v-icon>
                    </v-btn>
                    
                    <v-btn
                      icon
                      size="small"
                      @click="downloadMacro(item.name)"
                      color="info"
                      class="ml-2"
                    >
                      <v-icon>mdi-download</v-icon>
                    </v-btn>
                    
                    <v-btn
                      icon
                      size="small"
                      @click="confirmDelete(item)"
                      color="error"
                      class="ml-2"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>

                  <template v-slot:item.status="{ item }">
                    <v-chip
                      v-if="currentRunningMacro === item.name"
                      color="success"
                      size="small"
                    >
                      <v-icon left>mdi-play</v-icon>
                      Playing
                    </v-chip>
                    <v-chip
                      v-else
                      color="grey"
                      variant="outlined"
                      size="small"
                    >
                      Ready
                    </v-chip>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>

            <!-- Playback Controls Section -->
            <v-row v-if="isRunning" class="mb-4">
              <v-col cols="12">
                <v-card color="success" variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <h4>Playing: {{ currentRunningMacro }}</h4>
                        <v-progress-linear
                          v-if="playbackProgress >= 0"
                          :model-value="playbackProgress"
                          class="mt-2"
                          height="8"
                        />
                      </div>
                      <v-btn
                        @click="stopMacro"
                        color="error"
                        variant="outlined"
                      >
                        <v-icon left>mdi-stop</v-icon>
                        Stop Playback
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Upload/Import Section -->
            <v-row>
              <v-col cols="12">
                <h3 class="mb-3">Import Macro</h3>
                <v-file-input
                  v-model="uploadFile"
                  label="Upload Macro File"
                  accept=".macro,.json"
                  @change="handleFileUpload"
                  prepend-icon="mdi-upload"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Macro</v-card-title>
        <v-card-text>
          Are you sure you want to delete the macro "{{ macroToDelete?.name }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn @click="confirmDeleteMacro" color="error">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useMacroRecorder } from '@/composables/useMacroRecorder'

export default {
  name: 'MacroRecording',
  setup() {
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

    // Local state
    const loading = ref(false)
    const uploadFile = ref(null)
    const deleteDialog = ref(false)
    const macroToDelete = ref(null)
    const currentRunningMacro = ref('')
    const playbackProgress = ref(-1)

    // Table headers
    const headers = [
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Created', key: 'created', sortable: true },
      { title: 'Size', key: 'size', sortable: true },
      { title: 'Status', key: 'status', sortable: false },
      { title: 'Actions', key: 'actions', sortable: false }
    ]

    // Computed properties
    const macrosList = computed(() => {
      if (!Array.isArray(macros.value)) return []
      
      return macros.value.map(macro => ({
        name: macro.name || 'Unnamed',
        created: macro.created || 'Unknown',
        size: macro.size || 'Unknown',
        status: currentRunningMacro.value === macro.name ? 'Playing' : 'Ready'
      }))
    })

    // Methods
    const confirmDelete = (item) => {
      macroToDelete.value = item
      deleteDialog.value = true
    }

    const confirmDeleteMacro = async () => {
      if (macroToDelete.value) {
        await deleteMacro(macroToDelete.value.name)
        deleteDialog.value = false
        macroToDelete.value = null
      }
    }

    const handleFileUpload = (event) => {
      if (uploadFile.value) {
        console.log('Uploading macro file:', uploadFile.value.name)
        // TODO: Implement file upload logic
      }
    }

    const runMacroWithProgress = async (macroName) => {
      currentRunningMacro.value = macroName
      playbackProgress.value = 0
      
      try {
        await runMacro(macroName)
      } finally {
        currentRunningMacro.value = ''
        playbackProgress.value = -1
      }
    }

    const stopMacroPlayback = async () => {
      await stopMacro()
      currentRunningMacro.value = ''
      playbackProgress.value = -1
    }

    // Lifecycle
    onMounted(() => {
      loadMacros()
    })

    return {
      // State
      isRecording,
      isRunning,
      macros,
      loading,
      uploadFile,
      deleteDialog,
      macroToDelete,
      currentRunningMacro,
      playbackProgress,
      
      // Computed
      macrosList,
      headers,
      
      // Methods
      startRecording,
      stopRecording,
      runMacro: runMacroWithProgress,
      stopMacro: stopMacroPlayback,
      downloadMacro,
      confirmDelete,
      confirmDeleteMacro,
      handleFileUpload
    }
  }
}
</script>

<style scoped>
.macro-recording {
  max-width: 1200px;
  margin: 0 auto;
}

.pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.v-data-table {
  border-radius: 8px;
}
</style>