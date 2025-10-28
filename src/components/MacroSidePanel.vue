<template>
  <div class="macro-side-panel">
    <!-- Action Timeline Panel -->
    <div class="action-timeline-panel">
      <div class="panel-header">
        <div class="header-left">
          <v-icon color="#64B5F6" size="20">mdi-timeline</v-icon>
          <span class="panel-title">Action Timeline</span>
        </div>
        <div class="speed-controls">
          <v-btn
            size="x-small"
            variant="text"
            :class="{ active: speed === '1X' }"
            @click="speed = '1X'"
            >1X</v-btn
          >
          <v-btn
            size="x-small"
            variant="text"
            :class="{ active: speed === '2X' }"
            @click="speed = '2X'"
            >2X</v-btn
          >
          <v-btn
            size="x-small"
            variant="text"
            :class="{ active: speed === '4X' }"
            @click="speed = '4X'"
            >4X</v-btn
          >
          <v-icon size="16">mdi-dots-vertical</v-icon>
        </div>
      </div>

      <!-- Timeline Tracks -->
      <div class="timeline-tracks">
        <div v-for="track in tracks" :key="track.id" class="track-row">
          <div class="track-header">
            <v-avatar :color="track.color" size="20">
              <v-icon size="12" color="white">{{ track.icon }}</v-icon>
            </v-avatar>
            <div class="track-info">
              <div class="track-name">{{ track.name }}</div>
              <div class="track-count">{{ track.events.length }} events</div>
            </div>
            <div class="track-actions">
              <v-icon size="14" color="#64B5F6">mdi-eye</v-icon>
              <v-icon size="14" color="#888">mdi-lock</v-icon>
            </div>
          </div>
          <div class="track-timeline">
            <div
              class="playhead"
              :style="{ left: playheadPosition + '%' }"
            ></div>
            <div
              v-for="event in track.events"
              :key="event.id"
              class="event-block"
              :style="{
                left: event.position + '%',
                width: event.width + '%',
                backgroundColor: event.color
              }"
              @click="selectEvent(event)"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Details Panel -->
    <div class="action-details-panel">
      <div class="details-header">
        <v-icon size="18" color="#A5D6A7">mdi-chart-timeline-variant</v-icon>
        <span class="details-title">Action Details</span>
        <v-chip size="x-small" color="#64B5F6" variant="flat">CLICK</v-chip>
      </div>

      <div class="details-grid">
        <div class="detail-field">
          <label>Start Time</label>
          <v-text-field
            v-model="selectedEvent.startTime"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </div>
        <div class="detail-field">
          <label>Duration</label>
          <v-text-field
            v-model="selectedEvent.duration"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </div>
        <div class="detail-field">
          <label>X Position</label>
          <v-text-field
            v-model="selectedEvent.xPosition"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </div>
        <div class="detail-field">
          <label>Y Position</label>
          <v-text-field
            v-model="selectedEvent.yPosition"
            density="compact"
            variant="outlined"
            hide-details
          ></v-text-field>
        </div>
      </div>

      <div class="action-description">
        <label>Action Details</label>
        <v-textarea
          v-model="selectedEvent.description"
          density="compact"
          variant="outlined"
          hide-details
          rows="2"
        ></v-textarea>
      </div>

      <div class="details-actions">
        <v-btn size="small" variant="text" color="#64B5F6">
          <v-icon size="16" class="mr-1">mdi-clock</v-icon>
          JUMP TO TIME
        </v-btn>
        <v-btn size="small" variant="outlined">
          <v-icon size="16" class="mr-1">mdi-pencil</v-icon>
          EDIT
        </v-btn>
        <v-btn size="small" variant="outlined">
          <v-icon size="16" class="mr-1">mdi-content-copy</v-icon>
          DUPLICATE
        </v-btn>
        <v-btn size="small" variant="text" color="error">
          <v-icon size="16" class="mr-1">mdi-delete</v-icon>
          DELETE
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  playheadPosition: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['eventSelected'])

const speed = ref('1X')

const tracks = ref([
  {
    id: 1,
    name: 'Mouse Events',
    color: '#81C784',
    icon: 'mdi-cursor-default',
    events: [
      { id: 1, position: 10, width: 4, color: 'rgba(129, 199, 132, 0.8)' },
      { id: 2, position: 30, width: 3, color: 'rgba(129, 199, 132, 0.6)' },
      { id: 3, position: 70, width: 4, color: 'rgba(129, 199, 132, 0.8)' },
    ]
  },
  {
    id: 2,
    name: 'Keyboard Events',
    color: '#64B5F6',
    icon: 'mdi-keyboard',
    events: [
      { id: 4, position: 15, width: 5, color: 'rgba(100, 181, 246, 0.8)' },
      { id: 5, position: 25, width: 4, color: 'rgba(100, 181, 246, 0.8)' },
      { id: 6, position: 45, width: 8, color: 'rgba(100, 181, 246, 0.8)' },
      { id: 7, position: 75, width: 5, color: 'rgba(100, 181, 246, 0.8)' },
    ]
  },
  {
    id: 3,
    name: 'Power Control',
    color: '#FF8A65',
    icon: 'mdi-power',
    events: []
  },
  {
    id: 4,
    name: 'Target Switching',
    color: '#BA68C8',
    icon: 'mdi-target',
    events: [
      { id: 8, position: 12, width: 6, color: 'rgba(186, 104, 200, 0.8)' },
      { id: 9, position: 60, width: 6, color: 'rgba(186, 104, 200, 0.8)' },
    ]
  }
])

const selectedEvent = ref({
  startTime: '00:15.0',
  duration: '2s',
  xPosition: '42.5%',
  yPosition: '28.3%',
  description: 'Left click on login button'
})

const selectEvent = (event) => {
  emit('eventSelected', event)
}
</script>

<style scoped>
.macro-side-panel {
  background-color: #1a1a1a;
  color: #e0e0e0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
  width: 400px;
  min-width: 400px;
}

/* Action Timeline Panel */
.action-timeline-panel {
  background-color: #252525;
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #333;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
}

.speed-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.speed-controls .v-btn {
  color: #888;
  min-width: 28px;
}

.speed-controls .v-btn.active {
  color: #64b5f6;
  background-color: rgba(100, 181, 246, 0.1);
}

/* Timeline Tracks */
.timeline-tracks {
  display: flex;
  flex-direction: column;
}

.track-row {
  border-bottom: 1px solid #2a2a2a;
}

.track-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #2a2a2a;
}

.track-info {
  flex: 1;
}

.track-name {
  font-size: 12px;
  font-weight: 500;
  color: #e0e0e0;
}

.track-count {
  font-size: 10px;
  color: #888;
}

.track-actions {
  display: flex;
  gap: 6px;
}

.track-timeline {
  position: relative;
  height: 40px;
  background-color: #1f1f1f;
  padding: 8px 12px;
}

.playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #ffa726;
  z-index: 10;
  transition: left 0.1s linear;
}

.playhead::before {
  content: '';
  position: absolute;
  top: 6px;
  left: -3px;
  width: 8px;
  height: 8px;
  background-color: #ffa726;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 167, 38, 0.6);
}

.event-block {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.event-block:hover {
  filter: brightness(1.2);
  transform: translateY(-50%) scale(1.1);
}

/* Action Details Panel */
.action-details-panel {
  background-color: #252525;
  border-radius: 8px;
  padding: 12px;
  flex-shrink: 0;
}

.details-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.details-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.detail-field label {
  display: block;
  font-size: 10px;
  color: #888;
  margin-bottom: 3px;
}

.action-description {
  margin-bottom: 12px;
}

.action-description label {
  display: block;
  font-size: 10px;
  color: #888;
  margin-bottom: 3px;
}

.details-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* Vuetify Overrides */
:deep(.v-field) {
  background-color: #1f1f1f;
  border-color: #333;
}

:deep(.v-field__input) {
  color: #e0e0e0;
  font-size: 11px;
  padding: 4px 6px;
}

:deep(.v-textarea .v-field__input) {
  padding: 6px;
}
</style>