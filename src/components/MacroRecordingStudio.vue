<template>
  <v-container fluid class="pa-0 macro-studio-container">
    <div class="timeline-app">
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
              <v-avatar :color="track.color" size="24">
                <v-icon size="14" color="white">{{ track.icon }}</v-icon>
              </v-avatar>
              <div class="track-info">
                <div class="track-name">{{ track.name }}</div>
                <div class="track-count">{{ track.events.length }} events</div>
              </div>
              <div class="track-actions">
                <v-icon size="16" color="#64B5F6">mdi-eye</v-icon>
                <v-icon size="16" color="#888">mdi-lock</v-icon>
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

        <!-- Timeline Footer -->
        <div class="timeline-footer">
          <div class="footer-info">
            <span>15 total actions</span>
            <span>4 active tracks</span>
            <span>Duration: {{ formatDuration(duration) }}</span>
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
  </v-container>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'

  const speed = ref('1X')
  const playheadPosition = ref(0)
  const currentTime = ref(0)
  const duration = ref(180) // 3 minutes in seconds
  const isPlaying = ref(false)
  let animationFrame = null

  const speedMultiplier = computed(() => {
    switch (speed.value) {
      case '2X': return 2
      case '4X': return 4
      default: return 1
    }
  })

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
    const allEvents = []
    tracks.value.forEach(track => {
      track.events.forEach(event => {
        const eventStartTime = (event.position / 100) * duration.value
        allEvents.push({
          ...event,
          time: eventStartTime,
          trackName: track.name
        })
      })
    })
    return allEvents.sort((a, b) => a.time - b.time)
  }

  const animate = () => {
    if (isPlaying.value && currentTime.value < duration.value) {
      currentTime.value += 0.1 * speedMultiplier.value
      if (currentTime.value > duration.value) {
        currentTime.value = duration.value
      }
      updatePlayhead()
      animationFrame = requestAnimationFrame(animate)
    } else if (currentTime.value >= duration.value) {
      isPlaying.value = false
      currentTime.value = duration.value
    }
  }

  const togglePlay = () => {
    isPlaying.value = !isPlaying.value
    if (isPlaying.value) {
      if (currentTime.value >= duration.value) {
        currentTime.value = 0
      }
      animate()
    }
  }

  const stop = () => {
    isPlaying.value = false
    currentTime.value = 0
    updatePlayhead()
  }

  const goToFirst = () => {
    const allEvents = getAllEvents()
    if (allEvents.length > 0) {
      currentTime.value = allEvents[0].time
    } else {
      currentTime.value = 0
    }
    updatePlayhead()
  }

  const goToLast = () => {
    const allEvents = getAllEvents()
    if (allEvents.length > 0) {
      currentTime.value = allEvents[allEvents.length - 1].time
    } else {
      currentTime.value = duration.value
    }
    updatePlayhead()
  }

  const skipToPrevious = () => {
    const allEvents = getAllEvents()
    // Find events that come before current time
    const previousEvents = allEvents.filter(event => event.time < currentTime.value - 0.01)

    if (previousEvents.length > 0) {
      // Jump to the most recent previous event
      currentTime.value = previousEvents[previousEvents.length - 1].time
    } else {
      // If no previous events, go to first event
      if (allEvents.length > 0) {
        currentTime.value = allEvents[0].time
      } else {
        currentTime.value = 0
      }
    }
    updatePlayhead()
  }

  const skipToNext = () => {
    const allEvents = getAllEvents()
    // Find events that come after current time
    const nextEvent = allEvents.find(event => event.time > currentTime.value + 0.01)

    if (nextEvent) {
      // Jump to the next event
      currentTime.value = nextEvent.time
    } else {
      // If no next events, go to last event
      if (allEvents.length > 0) {
        currentTime.value = allEvents[allEvents.length - 1].time
      } else {
        currentTime.value = duration.value
      }
    }
    updatePlayhead()
  }

  const selectEvent = (event) => {
    console.log('Event selected:', event)
  }

  onMounted(() => {
    updatePlayhead()
  })

  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
  })

  // Make sure functions are available to template
  defineExpose({
    goToFirst,
    goToLast,
    skipToPrevious,
    skipToNext,
    togglePlay,
    stop
  })
</script>

<style scoped>
  .macro-studio-container {
    max-height: 70vh;
    width: 100%;
    margin: 0;
  }

  .timeline-app {
    background-color: #1a1a1a;
    color: #e0e0e0;
    height: auto;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    overflow-y: auto;
  }

  /* Action Timeline Panel */
  .action-timeline-panel {
    background-color: #252525;
    border-radius: 8px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #333;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-title {
    font-size: 14px;
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
    min-width: 32px;
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
    gap: 8px;
    padding: 8px 16px;
    background-color: #2a2a2a;
  }

  .track-info {
    flex: 1;
  }

  .track-name {
    font-size: 13px;
    font-weight: 500;
    color: #e0e0e0;
  }

  .track-count {
    font-size: 11px;
    color: #888;
  }

  .track-actions {
    display: flex;
    gap: 8px;
  }

  .track-timeline {
    position: relative;
    height: 60px;
    background-color: #1f1f1f;
    padding: 12px 16px;
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
    top: 50%;
    transform: translateY(-50%);
    height: 28px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .event-block:hover {
    filter: brightness(1.2);
    transform: translateY(-50%) scale(1.05);
  }

  /* Timeline Footer */
  .timeline-footer {
    padding: 8px 16px;
    background-color: #2a2a2a;
    border-top: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-info {
    display: flex;
    gap: 24px;
    font-size: 11px;
    color: #888;
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

  /* Action Details Panel */
  .action-details-panel {
    background-color: #252525;
    border-radius: 8px;
    padding: 16px;
  }

  .details-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }

  .details-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #e0e0e0;
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .detail-field label {
    display: block;
    font-size: 11px;
    color: #888;
    margin-bottom: 4px;
  }

  .action-description {
    margin-bottom: 16px;
  }

  .action-description label {
    display: block;
    font-size: 11px;
    color: #888;
    margin-bottom: 4px;
  }

  .details-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* Vuetify Overrides */
  :deep(.v-field) {
    background-color: #1f1f1f;
    border-color: #333;
  }

  :deep(.v-field__input) {
    color: #e0e0e0;
    font-size: 12px;
    padding: 6px 8px;
  }

  :deep(.v-textarea .v-field__input) {
    padding: 8px;
  }
</style>
