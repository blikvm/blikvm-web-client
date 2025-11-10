<template>
  <v-navigation-drawer v-if="settings.isVisible" permanent width="500">
    <!-- HEADER SECTION background-image: url('/bg-2.jpg'); background-size: cover; -->
    <template #prepend>
      <v-img src="/bg-2.jpg" style="position: relative">
        <!-- Close button -->
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          style="position: absolute; top: 8px; right: 8px; z-index: 10"
          @click="settings.isVisible = false"
        />

        <div class="text-h4 text-center mb-0 font-weight-medium" style="color: #76ff03">
          BliKVM Matrix
          <v-btn
            slim
            variant="tonal"
            color="#76FF03"
            rounded="lg"
            class="text-h6 text-start mb-4 font-weight-medium text-none"
            style="margin-top: 25px; margin-left: -15px"
          >
            {{ productVersion }}
          </v-btn>
        </div>

        <div class="text-h6 text-center mb-4 font-weight-medium" style="margin-top: -15px">
          {{ $t('app.subtitle') }}
        </div>

        <div class="d-flex ga-0 align-end" style="height: 100px">
          <v-tabs v-model="tab" density="compact" hide-slider class="align-self-end">
            <v-tab value="configuration" color="#76FF03">
              <v-icon icon="mdi-cog-outline" />&nbsp;
              {{ $t('settings.title') }}
            </v-tab>
          </v-tabs>
        </div>
      </v-img>
    </template>

    <!-- SCROLLABLE SECTION -->
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="configuration">
        <Settings />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-navigation-drawer>
</template>

<script setup>
  import { ref } from 'vue';
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';

  const store = useAppStore();

  const { settings, productVersion } = storeToRefs(store);

  const tab = ref('');
</script>
