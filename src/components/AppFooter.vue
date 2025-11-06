<template>
  <!-- NOTE: there are two footers-->
  <v-footer
    v-if="
      showKeyboard || showVirtualMouse || device.showSSHTerminal || showSerial || showNotifications
    "
    class="pb-0 d-flex flex-column bg-black"
  >
    <v-row v-if="showKeyboard" no-gutters dense align="center" class="w-100" style="height: 35px">
      <v-col cols="auto" class="d-flex justify-end" v-if="isExperimental">
        <v-btn
          prepend-icon="mdi-chevron-down"
          density="compact"
          rounded="lg"
          v-ripple
          variant="tonal"
          color="#76FF03"
          style="text-transform: none"
          >Detach</v-btn
        >
      </v-col>

      <v-spacer></v-spacer>
    </v-row>

    <v-row v-if="showKeyboard" no-gutters dense align="center" justify="center" class="mb-0">
      <v-col cols="auto" class="d-flex align-center">
        <KeyboardShortcuts />
        <v-btn
          prepend-icon="mdi-chevron-down"
          density="compact"
          rounded="lg"
          v-ripple
          variant="tonal"
          color="#76FF03"
          style="text-transform: none"
          class="ml-2"
          @click="handleClick('keyboard')"
        >
          {{ $t('common.hide') }}
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="showKeyboard" class="mt-n2">
      <v-col cols="12" class="d-flex justify-center">
        <myKeyboard
          :input="device.hid.keyboard.inputKey"
          @onKeyPress="handleKeyPress"
          @onKeyReleased="handleKeyReleased"
        ></myKeyboard>
      </v-col>
    </v-row>

    <v-row v-if="showVirtualMouse && isTouchDevice" dense no-gutters align="center" class="w-100">
      <v-col cols="12" class="d-flex justify-center">
        <VirtualMouse />
      </v-col>
    </v-row>

    <v-row v-if="device.showSSHTerminal" dense no-gutters class="pa-0 ma-0 w-100">
      <v-col cols="12" class="pa-0 ma-0 d-flex align-center justify-center" style="padding: 4px">
        <div style="color: #76ff03">
          <v-icon color="primary">mdi-toaster-oven</v-icon> `{{ systeminfo.hostname }}` on
          {{ device.os.distro }} {{ device.os.codename }}
          {{ device.os.release }}
        </div>
      </v-col>
    </v-row>

    <v-row v-if="device.showSSHTerminal" dense no-gutters>
      <v-divider />
      <AppConsole style="margin: 0; padding: 0" />
    </v-row>

    <!-- TODO serial should be shown in console, so next to each other. 
     This will give the highest business value -->
    <v-row v-if="showSerial" dense no-gutters align="center" class="w-100">
      <AppSerial />
    </v-row>

    <v-row v-if="showNotifications">
      <AppNotification />
    </v-row>
  </v-footer>

  <div v-if="footer.showFooter || footer.pinnedFooter">
    <v-footer class="d-flex flex-column pa-0 bg-black" height="40">
      <v-row no-gutters dense align="center" class="w-100" style="height: 40px">
        <v-col order="first" class="d-flex justify-start align-center">
          <v-icon
            color="#76FF03"
            :class="{ 'pin-active': footer.pinnedFooter }"
            @click.stop="pinMenu"
          >
            {{ footer.pinnedFooter ? 'mdi-pin-outline' : 'mdi-pin-off-outline' }}
          </v-icon>
          <!--
          <v-chip 
            v-if="device.hid.keyboard.keyPress"
            grow
            color="#76FF03"
            :ripple="false"
            v-tooltip:top="$t('keypress')"
            class="align-center cursor-default"
            @click.stop
          >
            {{ device.hid.keyboard.keyPress }}</v-chip
          >
-->
        </v-col>

        <!-- this one is a little weird, but it works -->
        <v-spacer />
        <v-spacer />

        <v-col v-if="smAndUp" cols="1" class="d-flex justify-center align-center">
          <div v-for="(item, index) in menuItems" :key="index">
            <v-btn
              class="text-none"
              :color="activeIndex === index ? '#76FF03' : 'white'"
              :icon="activeIndex === index ? undefined : item.icon"
              :prepend-icon="activeIndex === index ? item.icon : undefined"
              size="small"
              v-ripple
              :text="activeIndex === index ? item.text : undefined"
              :variant="activeIndex === index ? 'tonal' : 'plain'"
              @click="
                () => {
                  activeIndex = index;
                  handleClick(item.id);
                }
              "
            >
            </v-btn>
          </div>
        </v-col>

        <v-spacer />

        <v-col class="d-flex justify-end align-center pa-0 ma-0">
          <v-chip
            v-if="device.hid.keyboard.keyPress"
            grow
            color="#76FF03"
            :ripple="false"
            v-tooltip:top="$t('common.keypress')"
            class="align-center cursor-default"
            @click.stop
          >
            {{ device.hid.keyboard.keyPress }}</v-chip
          >
        </v-col>

        <v-divider class="mx-3" inset vertical></v-divider>

        <v-col order="last" class="d-flex justify-end align-center pa-0 ma-0">
          <v-chip
            :disabled="!device.hid.keyboard.isCapsLock"
            :color="device.hid.keyboard.isCapsLock ? '#76FF03' : ''"
            >Caps lock</v-chip
          >
          <v-chip
            :disabled="!device.hid.keyboard.isNumLock"
            :color="device.hid.keyboard.isNumLock ? '#76FF03' : ''"
            >Num lock</v-chip
          >
          <v-chip
            :disabled="!device.hid.keyboard.isScrollLock"
            :color="device.hid.keyboard.isScrollLock ? '#76FF03' : ''"
            >Scroll lock</v-chip
          >&nbsp;
        </v-col>
      </v-row>
    </v-footer>
  </div>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useKeyboard } from '@/composables/useKeyboard-new';
  import myKeyboard from '@/components/MySimpleKeyboard2';
  import KeyboardShortcuts from '@/components/KeyboardShortcuts.vue';
  import AppNotification from './AppNotifications.vue';
  import { useKeymap } from '@/composables/useKeymap';
  import { useI18n } from 'vue-i18n';
  import { useDisplay } from 'vuetify';
  import { onMounted, ref, computed, shallowRef } from 'vue';

  const { smAndUp } = useDisplay();

  const store = useAppStore();
  const { device } = useDevice();
  const { isExperimental, footer, isTouchDevice, systeminfo } = storeToRefs(store);
  const { handleKeyPress, handleKeyReleased } = useKeyboard(device.value.ws);
  const { t } = useI18n();
  const showKeyboard = ref(false);
  const showVirtualMouse = ref(false);
  const showSerial = ref(false);
  const showNotifications = ref(false);
  let activeIndex = shallowRef(0);

  const pinMenu = () => {
    footer.value.pinnedFooter = !footer.value.pinnedFooter;
    if (footer.value.pinnedFooter) {
      footer.value.showFooter = true; // Keep menu visible when pinned
    }
  };

  const baseItems = [
    { id: 'keyboard', text: t('common.keyboard'), icon: 'mdi-keyboard' },
    { id: 'mouse', text: t('common.mouse'), icon: 'mdi-mouse-outline' },
    { id: 'console', text: t('appFooter.sshTerminal'), icon: 'mdi-console-line' },
    { id: 'serial', text: t('appFooter.serialTerminal'), icon: 'mdi-console-line' },
    { id: 'notifications', text: t('notification.title'), icon: 'mdi-bell-outline' },
  ];

  const menuItems = computed(() =>
    baseItems.filter((i) => i.id !== 'mouse' || isTouchDevice.value)
  );

  const handleClick = (value) => {
    switch (value) {
      case 'keyboard':
        showKeyboard.value = !showKeyboard.value;
        device.value.showSSHTerminal = false;
        showNotifications.value = false;
        break;
      case 'mouse':
        showVirtualMouse.value = !showVirtualMouse.value;
        device.value.showSSHTerminal = false;
        showNotifications.value = false;
        break;
      case 'console':
        device.value.showSSHTerminal = !device.value.showSSHTerminal;
        showVirtualMouse.value = false;
        showKeyboard.value = false;
        showNotifications.value = false;
        break;
      case 'serial':
        showSerial.value = !showSerial.value;
        showVirtualMouse.value = false;
        device.value.showSSHTerminal = false;
        showKeyboard.value = false;
        showNotifications.value = false;
        break;
      case 'notifications':
        showNotifications.value = !showNotifications.value;
        showVirtualMouse.value = false;
        showKeyboard.value = false;
        device.value.showSSHTerminal = false;
        break;
      case 'experimental':
        isExperimental.value = !isExperimental.value;
        showVirtualMouse.value = false;
        showKeyboard.value = false;
        device.value.showSSHTerminal = false;
        showNotifications.value = false;
        break;
    }
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      isTouchDevice.value =
        'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
      if (!isTouchDevice.value) showVirtualMouse.value = false;
    }
  });
</script>

<style scoped>
  /* When the keyboard is expanded, increase the height and allow scrolling */
  .keyboard-container.expanded {
    height: auto;
    /* Fixed expanded height */
    overflow-y: hidden;
    /* Allow vertical scrolling */
    padding: 0;
    /* Remove padding when expanded to maximize space */
  }

  /* Ensure the collapsed state is still visible */
  .keyboard-container.collapsed {
    overflow: hidden;
    /* Hide overflow content */
  }

  .keyboardContainer {
    display: flex;
    background-color: black;
    justify-content: center;
    width: 1024px;
    margin: 0 auto;
    border-radius: 5px;
  }

  .selectedClassORG {
    color: rgb(231, 124, 124);
    border-top: 1px solid rgb(241, 60, 60);
    border-bottom: 1px solid rgb(241, 60, 60);
    border-left: 1px solid rgb(241, 60, 60);
    border-right: 1px solid rgb(241, 60, 60);
  }

  .selectedClass {
    color: rgb(#76ff03);
    border-top: 1px solid rgb(#76ff03);
    border-bottom: 1px solid rgb(#76ff03);
    border-left: 1px solid rgb(#76ff03);
    border-right: 1px solid rgb(#76ff03);
  }

  .cursor-default {
    cursor: default;
  }
</style>
