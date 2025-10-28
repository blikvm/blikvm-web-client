<template>
  <div class="unified-timeline-container">
    <div class="timeline-header">
      <div class="header-left">
        <v-icon color="#64B5F6" size="20">mdi-timeline-clock</v-icon>
        <span class="timeline-title">Unified Timeline</span>
      </div>
      <div class="playback-controls">
        <v-btn icon size="small" variant="text" @click="goToFirst">
          <v-icon>mdi-skip-backward</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" @click="skipToPrevious">
          <v-icon>mdi-skip-previous</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" @click="togglePlay">
          <v-icon>{{ isPlaying ? 'mdi-pause' : 'mdi-play' }}</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" @click="stop">
          <v-icon>mdi-stop</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" @click="skipToNext">
          <v-icon>mdi-skip-next</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" @click="goToLast">
          <v-icon>mdi-skip-forward</v-icon>
        </v-btn>
      </div>
      <div class="time-display">
        {{ formatTime(currentTime) }} / {{ formatDuration(duration) }}
      </div>
    </div>

    <div class="unified-track">
      <div class="track-timeline">
        <div
          class="playhead"
          :style="{ left: playheadPosition + '%' }"
        ></div>
        
        <!-- Render all events from all tracks in a single timeline -->
        <div
          v-for="event in allEvents"
          :key="`${event.trackId}-${event.id}`"
          class="event-block"
          :style="{
            left: event.position + '%',
            width: event.width + '%',
            backgroundColor: event.color,
            height: getEventHeight(event.trackId) + 'px',
            top: getEventTop(event.trackId) + 'px'
          }"
          @click="selectEvent(event)"
        >
          <div class="event-tooltip">
            {{ event.trackName }}: {{ event.description || 'Event' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Legend for event types -->
    <div class="timeline-legend">
      <div v-for="track in tracks" :key="track.id" class="legend-item">
        <div class="legend-color" :style="{ backgroundColor: track.color }"></div>
        <span class="legend-label">{{ track.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
const props = defineProps({
  isPlaying: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['play', 'pause', 'stop', 'seek', 'eventSelected'])

const playheadPosition = ref(0)
const currentTime = ref(0)
const duration = ref(180) // 3 minutes in seconds
const isPlaying = ref(false)
let animationFrame = null

// Sample tracks data - this would come from the macro recording system
const tracks = ref([
  {
    id: 1,
    name: 'Mouse Events',
    color: '#81C784',
    icon: 'mdi-cursor-default',
    events: [
      { id: 1, position: 10, width: 2, color: '#81C784', description: 'Left click' },
      { id: 2, position: 30, width: 1.5, color: '#81C784', description: 'Right click' },
      { id: 3, position: 70, width: 2, color: '#81C784', description: 'Double click' },
    ]
  },
  {
    id: 2,
    name: 'Keyboard Events',
    color: '#64B5F6',
    icon: 'mdi-keyboard',
    events: [
      { id: 4, position: 15, width: 3, color: '#64B5F6', description: 'Type "admin"' },
      { id: 5, position: 25, width: 2, color: '#64B5F6', description: 'Tab key' },
      { id: 6, position: 45, width: 4, color: '#64B5F6', description: 'Type password' },
      { id: 7, position: 75, width: 2.5, color: '#64B5F6', description: 'Enter key' },
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
      { id: 8, position: 12, width: 3, color: '#BA68C8', description: 'Switch to target 1' },
      { id: 9, position: 60, width: 3, color: '#BA68C8', description: 'Switch to target 2' },
    ]
  }
])

// Flatten all events with track information
const allEvents = computed(() => {
  const events = []
  tracks.value.forEach(track => {
    track.events.forEach(event => {
      events.push({
        ...event,
        trackId: track.id,
        trackName: track.name,
        trackColor: track.color
      })
    })
  })
  return events.sort((a, b) => a.position - b.position)
})

// Calculate event positioning in the unified timeline
const getEventHeight = (trackId) => {
  // Each track gets 8px height with 2px spacing
  return 8
}

const getEventTop = (trackId) => {
  // Stack events vertically by track
  const trackIndex = tracks.value.findIndex(t => t.id === trackId)
  return trackIndex * 12 + 16 // 8px height + 4px spacing + 16px top padding
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const decimal = Math.floor((seconds % 1) * 10)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${decimal}`
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.0`
}

const updatePlayhead = () => {
  playheadPosition.value = (currentTime.value / duration.value) * 100
}

const getAllEvents = () => {
  return allEvents.value.map(event => ({
    ...event,
    time: (event.position / 100) * duration.value
  })).sort((a, b) => a.time - b.time)
}

const animate = () => {
  if (isPlaying.value && currentTime.value < duration.value) {
    currentTime.value += 0.1
    if (currentTime.value > duration.value) {
      currentTime.value = duration.value
    }
    updatePlayhead()
    animationFrame = requestAnimationFrame(animate)
  } else if (currentTime.value >= duration.value) {
    isPlaying.value = false
    currentTime.value = duration.value
    emit('stop')
  }
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    if (currentTime.value >= duration.value) {
      currentTime.value = 0
    }
    emit('play')
    animate()
  } else {
    emit('pause')
  }
}

const stop = () => {
  isPlaying.value = false
  currentTime.value = 0
  updatePlayhead()
  emit('stop')
}

const goToFirst = () => {
  const events = getAllEvents()
  if (events.length > 0) {
    currentTime.value = events[0].time
  } else {
    currentTime.value = 0
  }
  updatePlayhead()
  emit('seek', currentTime.value)
}

const goToLast = () => {
  const events = getAllEvents()
  if (events.length > 0) {
    currentTime.value = events[events.length - 1].time
  } else {
    currentTime.value = duration.value
  }
  updatePlayhead()
  emit('seek', currentTime.value)
}

const skipToPrevious = () => {
  const events = getAllEvents()
  const previousEvents = events.filter(event => event.time < currentTime.value - 0.01)

  if (previousEvents.length > 0) {
    currentTime.value = previousEvents[previousEvents.length - 1].time
  } else {
    if (events.length > 0) {
      currentTime.value = events[0].time
    } else {
      currentTime.value = 0
    }
  }
  updatePlayhead()
  emit('seek', currentTime.value)
}

const skipToNext = () => {
  const events = getAllEvents()
  const nextEvent = events.find(event => event.time > currentTime.value + 0.01)

  if (nextEvent) {
    currentTime.value = nextEvent.time
  } else {
    if (events.length > 0) {
      currentTime.value = events[events.length - 1].time
    } else {
      currentTime.value = duration.value
    }
  }
  updatePlayhead()
  emit('seek', currentTime.value)
}

const selectEvent = (event) => {
  emit('eventSelected', event)
}

onMounted(() => {
  updatePlayhead()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
})
</script>

<style scoped>
.unified-timeline-container {
  background-color: #252525;
  border-radius: 8px;
  overflow: hidden;
  height: 120px;
  min-height: 120px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #333;
  background-color: #2a2a2a;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: #e0e0e0;
}

.playback-controls {
  display: flex;
  gap: 4px;
}

.playback-controls .v-btn {
  color: #e0e0e0;
}

.playback-controls .v-btn:hover {
  background-color: rgba(100, 181, 246, 0.1);
}

.time-display {
  font-size: 11px;
  color: #888;
  font-family: monospace;
}

.unified-track {
  flex: 1;
  position: relative;
}

.track-timeline {
  position: relative;
  height: 80px;
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
  top: 8px;
  left: -4px;
  width: 10px;
  height: 10px;
  background-color: #ffa726;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(255, 167, 38, 0.6);
}

.event-block {
  position: absolute;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 5;
}

.event-block:hover {
  filter: brightness(1.3);
  transform: scale(1.1);
  z-index: 8;
}

.event-block:hover .event-tooltip {
  opacity: 1;
  pointer-events: auto;
}

.event-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 20;
  margin-bottom: 4px;
}

.timeline-legend {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background-color: #2a2a2a;
  border-top: 1px solid #333;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  font-size: 11px;
  color: #888;
}
</style>