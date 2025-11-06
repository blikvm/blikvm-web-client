<template>
  <v-expansion-panel value="wifi" selected-class="selected-panel">
    <v-expansion-panel-title>
      <template v-slot:default="{ expanded }">
        <v-card class="transparent-card" density="compact" tile width="100%">
          <v-row dense no-gutters>
            <v-col cols="1" class="d-flex justify-start align-center">
              <v-icon>mdi-wifi</v-icon>
            </v-col>
            <v-col cols="8" class="d-flex justify-start align-center">
              {{ $t('settings.network.wifi.title') }}
            </v-col>
            <v-col
              cols="3"
              class="d-flex justify-end align-center"
              :style="{
                color: wifiStatus.connected ? '#76FF03' : '#D32F2F',
              }"
            >
              <v-chip prepend-icon="mdi-circle-medium">
                {{ wifiStatus.connected ? $t('common.connect') : $t('common.disconnect') }}
              </v-chip>
            </v-col>
          </v-row>
          <v-row v-if="expanded" dense>
            <v-col cols="12">
              <v-card-subtitle>{{ $t('settings.network.wifi.subtitle') }}</v-card-subtitle>
            </v-col>
          </v-row>
        </v-card>
      </template>
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <v-expansion-panels multiple>
        <!-- Current Connection Status -->
        <v-expansion-panel value="wifi-status">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-wifi-check</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.network.wifi.currentConnection') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <div v-if="wifiStatus.connected">
                <div class="text-caption">{{ $t('settings.network.wifi.ssid') }}</div>
                <v-row dense no-gutters>
                  <v-col cols="12">
                    <v-text-field
                      v-model="wifiStatus.ssid"
                      density="compact"
                      rounded="lg"
                      color="#76FF03"
                      variant="outlined"
                      hide-details
                      readonly
                    />
                  </v-col>
                </v-row>
                <br>
                
                <div class="text-caption">{{ $t('settings.network.wifi.ipAddress') }}</div>
                <v-row dense no-gutters>
                  <v-col cols="12">
                    <v-text-field
                      v-model="wifiStatus.ipAddress"
                      density="compact"
                      rounded="lg"
                      color="#76FF03"
                      variant="outlined"
                      hide-details
                      readonly
                    />
                  </v-col>
                </v-row>
                <br>
                
                <v-row dense no-gutters class="d-flex justify-start align-center">
                  <v-col class="d-flex justify-start" cols="4">
                    {{ $t('settings.network.wifi.signalStrength') }}
                  </v-col>
                  <v-col class="d-flex justify-end align-center" cols="8">
                    <v-icon :color="getSignalColor(wifiStatus.signal)" class="me-1">
                      {{ getSignalIcon(wifiStatus.signal) }}
                    </v-icon>
                    {{ wifiStatus.signal }}%
                  </v-col>
                </v-row>
                
                <v-row dense no-gutters class="d-flex justify-start align-center">
                  <v-col class="d-flex justify-start" cols="4">
                    {{ $t('settings.network.wifi.frequency') }}
                  </v-col>
                  <v-col class="d-flex justify-end align-center" cols="8">
                    {{ wifiStatus.frequency }}
                  </v-col>
                </v-row>
                
                <br>
                <v-row dense no-gutters>
                  <v-col cols="12">
                    <v-switch
                      :model-value="wifiStatus.connected"
                      inset
                      :label="$t('settings.network.wifi.title')"
                      v-ripple
                      color="#76FF03"
                      @update:modelValue="(value) => value ? null : disconnectWifi()"
                      :loading="loading"
                    />
                  </v-col>
                </v-row>
              </div>
              <v-alert v-else type="info" variant="outlined">
                <v-icon>mdi-wifi-off</v-icon>
                {{ $t('settings.network.wifi.notConnected') }}
              </v-alert>
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Available Networks -->
        <v-expansion-panel value="wifi-networks">
          <v-expansion-panel-title>
            <template v-slot:default="{ expanded }">
              <v-row dense no-gutters>
                <v-col cols="1">
                  <v-icon>mdi-wifi-settings</v-icon>
                </v-col>
                <v-col class="d-flex justify-start align-center" cols="4">
                  {{ $t('settings.network.wifi.availableNetworks') }}
                </v-col>
              </v-row>
            </template>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card-text class="text-medium-emphasis pa-6">
              <v-row dense no-gutters>
                <v-col cols="12">
                  <v-switch
                    :model-value="false"
                    inset
                    :label="$t('settings.network.wifi.scan')"
                    v-ripple
                    color="#76FF03"
                    @update:modelValue="(value) => value ? scanNetworks() : null"
                    :loading="scanning"
                  />
                </v-col>
              </v-row>
              <br>
            <v-list v-if="availableNetworks.length > 0" class="pa-0">
              <v-list-item
                v-for="network in availableNetworks"
                :key="network.ssid"
                @click="selectNetwork(network)"
                :class="{ 'bg-primary': selectedNetwork?.ssid === network.ssid }"
                rounded
                class="mb-1"
              >
                <template v-slot:prepend>
                  <v-icon :color="getSignalColor(network.signal)" size="large">
                    {{ getSignalIcon(network.signal) }}
                  </v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ network.ssid }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ network.security }} • {{ network.frequency }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <v-icon v-if="network.security !== 'Open'" size="small" class="me-2">
                      mdi-lock
                    </v-icon>
                    <v-chip size="small" variant="outlined">
                      {{ network.signal }}%
                    </v-chip>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            
            <v-alert v-else-if="!scanning" type="info" variant="outlined">
              {{ $t('settings.network.wifi.noNetworks') }}
            </v-alert>
            
            <v-progress-linear v-if="scanning" indeterminate color="primary" />
            </v-card-text>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-expansion-panel-text>
  </v-expansion-panel>

  <!-- Connection Dialog -->
  <v-dialog v-model="showConnectionDialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-wifi-plus</v-icon>
        {{ $t('settings.network.wifi.connectTo') }} "{{ selectedNetwork?.ssid }}"
      </v-card-title>
      <v-card-text>
        <v-form ref="connectionForm" @submit.prevent="connectToNetwork">
          <v-text-field
            v-if="selectedNetwork?.security !== 'Open'"
            v-model="password"
            :label="$t('settings.network.wifi.password')"
            type="password"
            :rules="passwordRules"
            variant="outlined"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            @click:append-inner="showPassword = !showPassword"
            required
          />
          <v-alert v-if="connectionError" type="error" class="mt-3">
            {{ connectionError }}
          </v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn 
          @click="cancelConnection"
          variant="outlined"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn 
          @click="connectToNetwork" 
          color="primary"
          :loading="connecting"
          :disabled="selectedNetwork?.security !== 'Open' && !password"
        >
          {{ $t('settings.network.wifi.connect') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Reactive data
const wifiStatus = ref({
  connected: false,
  ssid: '',
  signal: 0,
  ip_address: '',
  frequency: ''
})
const availableNetworks = ref([])
const selectedNetwork = ref(null)
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const scanning = ref(false)
const connecting = ref(false)
const showConnectionDialog = ref(false)
const connectionError = ref('')
const connectionForm = ref(null)

// Form validation
const passwordRules = [
  v => !!v || t('settings.network.wifi.passwordRequired'),
  v => v.length >= 8 || t('settings.network.wifi.passwordMiLength')
]

// Methods
const getSignalIcon = (signal) => {
  if (signal >= 75) return 'mdi-wifi-strength-4'
  if (signal >= 50) return 'mdi-wifi-strength-3'
  if (signal >= 25) return 'mdi-wifi-strength-2'
  return 'mdi-wifi-strength-1'
}

const getSignalColor = (signal) => {
  if (signal >= 75) return 'success'
  if (signal >= 50) return 'warning'
  return 'error'
}

const loadWifiStatus = async () => {
  try {
    loading.value = true
    // TODO: Implement API call to get WiFi status
    // const response = await fetch('/api/wifi/status')
    // const data = await response.json()
    // wifiStatus.value = data
    
    // Mock data for development
    wifiStatus.value = {
      connected: true,
      ssid: 'MyNetwork',
      signal: 85,
      ipAddress: '192.168.1.100',
      frequency: '2.4 GHz'
    }
  } catch (error) {
    console.error('Failed to load WiFi status:', error)
  } finally {
    loading.value = false
  }
}

const scanNetworks = async () => {
  try {
    scanning.value = true
    // TODO: Implement API call to scan networks
    // const response = await fetch('/api/wifi/scan')
    // const data = await response.json()
    // availableNetworks.value = data
    
    // Mock data for development
    await new Promise(resolve => setTimeout(resolve, 1500))
    availableNetworks.value = [
      { ssid: 'MyNetwork', signal: 85, security: 'WPA2', frequency: '2.4 GHz' },
      { ssid: 'GuestNetwork', signal: 65, security: 'Open', frequency: '5 GHz' },
      { ssid: 'NeighborWifi', signal: 45, security: 'WPA3', frequency: '2.4 GHz' },
      { ssid: 'CoffeeShop_Free', signal: 35, security: 'Open', frequency: '2.4 GHz' },
      { ssid: 'SecureNetwork_5G', signal: 72, security: 'WPA3', frequency: '5 GHz' }
    ]
  } catch (error) {
    console.error('Failed to scan networks:', error)
  } finally {
    scanning.value = false
  }
}

const selectNetwork = (network) => {
  selectedNetwork.value = network
  password.value = ''
  showPassword.value = false
  connectionError.value = ''
  showConnectionDialog.value = true
}

const connectToNetwork = async () => {
  try {
    connecting.value = true
    connectionError.value = ''
    
    // TODO: Implement API call to connect to network
    // const response = await fetch('/api/wifi/connect', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     ssid: selectedNetwork.value.ssid,
    //     password: password.value
    //   })
    // })
    
    // Mock connection with potential error
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Simulate 20% chance of connection failure for demo
    if (Math.random() < 0.2 && selectedNetwork.value.security !== 'Open') {
      connectionError.value = 'Invalid password or connection failed'
      return
    }
    
    wifiStatus.value = {
      connected: true,
      ssid: selectedNetwork.value.ssid,
      signal: selectedNetwork.value.signal,
      ip_address: '192.168.1.100',
      frequency: selectedNetwork.value.frequency
    }
    
    cancelConnection()
  } catch (error) {
    console.error('Failed to connect to network:', error)
    connectionError.value = 'Connection failed. Please try again.'
  } finally {
    connecting.value = false
  }
}

const disconnectWifi = async () => {
  try {
    loading.value = true
    // TODO: Implement API call to disconnect
    // await fetch('/api/wifi/disconnect', { method: 'POST' })
    
    // Mock disconnection
    await new Promise(resolve => setTimeout(resolve, 1000))
    wifiStatus.value = {
      connected: false,
      ssid: '',
      signal: 0,
      ipAddress: '',
      frequency: ''
    }
  } catch (error) {
    console.error('Failed to disconnect WiFi:', error)
  } finally {
    loading.value = false
  }
}

const cancelConnection = () => {
  selectedNetwork.value = null
  password.value = ''
  showPassword.value = false
  connectionError.value = ''
  showConnectionDialog.value = false
}

// Lifecycle
onMounted(() => {
  loadWifiStatus()
  scanNetworks()
})
</script>

<style scoped>
.selected-panel {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.transparent-card {
  background: transparent !important;
  box-shadow: none !important;
}
</style>