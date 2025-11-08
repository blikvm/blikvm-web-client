<!--
****************************************************************************
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
****************************************************************************
-->
<template>
  <v-sheet class="mx-auto wrap-text" width="480">
    <v-card-title>
      <v-row class="d-flex align-center" no-gutters>
        <v-col cols="auto">
          <v-tabs v-model="tab" :items="tabs" align-tabs="start" height="60" slider-color="#76FF03">
            <template #tab="{ item }">
              <v-tab
                v-if="item.experimental"
                :prepend-icon="item.icon"
                :text="item.text"
                :value="item.value"
                color="#76FF03"
                class="text-none"
              />
            </template>

            <template #item>
              <v-tabs-window-item value="tab-stream" class="pa-4">
                <v-card-subtitle class="d-flex justify-start">
                  {{ $t('settings.msd.stream.subtitle') }}
                </v-card-subtitle>
                <VirtualMediaStream />
              </v-tabs-window-item>
              <v-tabs-window-item value="tab-url" class="pa-4">
                <v-card-subtitle class="d-flex justify-start">
                  {{ $t('settings.msd.url.subtitle') }}
                </v-card-subtitle>
                <VirtualMediaUrl />
              </v-tabs-window-item>
              <v-tabs-window-item value="tab-local" class="pa-4" border>
                <v-card-subtitle class="d-flex justify-start">
                  {{ $t('settings.msd.local.subtitle') }}
                </v-card-subtitle>
                <VirtualMediaLocal />
              </v-tabs-window-item>
            </template>
          </v-tabs>
        </v-col>
      </v-row>
    </v-card-title>
  </v-sheet>
</template>

<script setup>
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();

  // local variables
  const tab = ref('tab-local');

  const tabs = [
    {
      icon: 'mdi-folder',
      text: t('common.local'),
      value: 'tab-local',
      experimental: true,
    },
    {
      icon: 'mdi-link-variant',
      text: 'URL',
      value: 'tab-url',
      experimental: false,
    },
    {
      icon: 'mdi-web',
      text: 'Stream',
      value: 'tab-stream',
      experimental: false,
    },
  ];
</script>
