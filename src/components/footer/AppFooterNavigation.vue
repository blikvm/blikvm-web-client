<template>
  <!-- Navigation bar -->
  <v-row 
    v-if="footer.showFooter" 
    no-gutters 
    dense 
    align="center" 
    class="w-100" 
    style="height: 40px"
  >
    <v-spacer />

    <!-- Navigation toggle buttons -->
    <v-col
      cols="auto"
      class="d-flex justify-center align-center footer-toggle-center"
    >
      <v-btn-toggle
        :model-value="activeToggle"
        multiple
        color="#76FF03"
        :density="isTouchDevice ? 'default' : 'compact'"
        elevation="0"
        @update:model-value="handleToggleChange"
      >
        <v-btn
          v-for="item in availableMenuItems"
          :key="item.id"
          :value="item.id"
          :prepend-icon="!isTouchDevice ? item.icon : undefined"
          :size="isTouchDevice ? 'default' : 'small'"
          variant="plain"
          elevation="0"
          :class="['text-none', { 'touch-optimized': isTouchDevice }]"
          :style="item.id === 'video' ? 'pointer-events: none;' : ''"
        >
          <v-icon v-if="isTouchDevice" size="small">{{ item.icon }}</v-icon>
          <span v-if="activeToggle.includes(item.id) && !isTouchDevice">{{ item.text }}</span>
        </v-btn>


        <!-- Microphone for touch devices -->
        <v-btn
          v-if="isTouchDevice" 
          variant="plain"
          elevation="0"
          color="#76FF03"
          :size="isTouchDevice ? 'default' : 'small'"
          :class="['microphone-btn', { 'touch-optimized': isTouchDevice }]"
          @click="toggleMicrophone"
        > 
        <v-icon v-if="isTouchDevice" size="small">{{ isMicrophoneOn ? 'mdi-microphone' : 'mdi-microphone-off' }}</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-col>

    <v-spacer />
  </v-row>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useI18n } from "vue-i18n";
import { useDisplay } from 'vuetify';

// Props
const props = defineProps({
  footer: {
    type: Object,
    required: true
  },
  activeToggle: {
    type: Array,
    required: true
  },
  device: {
    type: Object,
    required: true
  },
  lockStates: {
    type: Array,
    required: true
  },
  isTouchDevice: {
    type: Boolean,
    required: true
  },
  handleToggleChange: {
    type: Function,
    required: true
  },
});

// Composables
const { t } = useI18n();
const { smAndUp } = useDisplay();

// Menu items configuration
const menuItems = [
  { id: "keyboard", text: t("common.keyboard"), icon: "mdi-keyboard" },
  { id: "video", text: t("common.video"), icon: "mdi-monitor" },
  { id: "console", text: t("appFooter.sshTerminal"), icon: "mdi-console-line" },
  { id: "serial", text: t("appFooter.serialTerminal"), icon: "mdi-serial-port" },
  { id: "notifications", text: t("notification.title"), icon: "mdi-bell-outline" }
];

// Computed properties  
const availableMenuItems = computed(() => menuItems);

// Microphone state for touch devices
const isMicrophoneOn = ref(false);

// Microphone toggle function
const toggleMicrophone = () => {
  isMicrophoneOn.value = !isMicrophoneOn.value;
  console.log('Microphone toggled:', isMicrophoneOn.value ? 'ON' : 'OFF');
  // TODO: Implement actual microphone functionality
};
</script>

<style scoped>
.footer-toggle-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* Touch-optimized button styling */
.touch-optimized {
  min-height: 44px !important;
  min-width: 44px !important;
  padding: 8px 12px !important;
  margin: 0 4px !important;
}

/* Ensure touch targets have proper spacing */
.touch-optimized + .touch-optimized {
  margin-left: 8px !important;
}

/* Larger touch targets for better accessibility */
@media (max-width: 768px) {
  .touch-optimized {
    min-height: 48px !important;
    min-width: 48px !important;
    font-size: 14px !important;
  }
}

/* Microphone button styling */
.microphone-btn {
  min-height: 44px !important;
  min-width: 44px !important;
  margin-left: 8px !important;
}

/* Apply touch-optimized styling to microphone */
.microphone-btn.touch-optimized {
  min-height: 44px !important;
  min-width: 44px !important;
  padding: 8px 12px !important;
  margin: 0 4px !important;
}

/* Touch-optimized microphone button for mobile */
@media (max-width: 768px) {
  .microphone-btn {
    min-height: 48px !important;
    min-width: 48px !important;
    margin-left: 12px !important;
  }
  
  .microphone-btn.touch-optimized {
    min-height: 48px !important;
    min-width: 48px !important;
    font-size: 14px !important;
  }
}
</style>