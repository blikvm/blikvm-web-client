<template>
  <v-toolbar
    ref="toolbarRef"
    v-if="toolbar.visible || toolbar.pinned"
    height="30"
    elevation="10"
    app="false"
    dense
    short
    flat
    color="black"
    :style="toolbarStyle"
    class="toolbar-auto-hide"
  >
    <template #prepend>
      <div class="toolbar-content">
        <v-tooltip location="top" content-class="">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-icon 
              ref="dragHandleRef"
              v-bind="tooltipProps"
              color="#76FF03" 
              :class="{ 'pin-active': toolbar.pinned }"
              class="unified-handle" 
              role="button"
              tabindex="0"
              :aria-label="toolbar.pinned ? 'Toolbar is pinned - click to enable dragging' : 'Drag toolbar or click to pin'"
              :style="unifiedHandleStyle"
              @mousedown="handleMouseDown"
              @keydown="handleKeyDown"
            >
              {{ toolbar.pinned ? 'mdi-pin' : 'mdi-drag' }}
            </v-icon>
          </template>
          <span>{{ toolbar.pinned ? 'Pinned - click to enable dragging' : 'Drag to move, click to pin, double-click to center' }}</span>
        </v-tooltip>
      </div>
    </template>

    <slot name="toolbar-title">
      <span style="text-transform: none; margin-left: 4px">
        {{ systeminfo.hostname }}
      </span>
    </slot>

    <template v-if="$vuetify.display.smAndUp">
      <v-divider class="mx-1 align-self-center" length="24" thickness="2" vertical></v-divider>
    </template>

    <!-- Status Indicator (Connection + Health) -->
    <v-tooltip location="top" content-class="">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          :color="device.isDisconnected ? '#D32F2F' : healthIconColor"
          class="toolbar-icon"
          size="small"
        >
          {{ device.isDisconnected ? 'mdi-lan-disconnect' : 'mdi-heart-pulse' }}
        </v-icon>
      </template>
      <span>{{ device.isDisconnected ? $t('common.disconnect') : device.health.status }}</span>
    </v-tooltip>

    <!-- Expanded Controls Section -->
    <template v-if="toolbar.expanded">
      <v-divider class="mx-1 align-self-center" length="24" thickness="2" vertical></v-divider>
      
      <!-- KVM Status Icons -->
      <v-tooltip v-if="!device?.isDisconnected" location="top" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="device.hid.isActive && device.hid.keyboard.isActive ? '#76FF03' : '#D32F2F'"
            size="small"
          >mdi-keyboard</v-icon>
        </template>
        <span>{{ $t('common.keyboard') }} {{ device.hid.isActive && device.hid.keyboard.isActive ? $t('common.active') : $t('common.inactive') }}</span>
      </v-tooltip>

      <v-tooltip v-if="!device?.isDisconnected" location="top" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="isVideoActive ? '#76FF03' : '#D32F2F'"
            size="small"
          >mdi-monitor</v-icon>
        </template>
        <span>{{ $t('settings.device.video.title') }} {{ isVideoActive ? $t('common.active') : $t('common.inactive') }}</span>
      </v-tooltip>

      <v-tooltip v-if="!device?.isDisconnected" location="top" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="device.hid.isActive && device.hid.mouse.isActive ? '#76FF03' : '#D32F2F'"
            size="small"
          >mdi-mouse</v-icon>
        </template>
        <span>{{ $t('common.mouse') }} {{ device.hid.isActive && device.hid.mouse.isActive ? $t('common.active') : $t('common.inactive') }}</span>
      </v-tooltip>

      <v-divider class="mx-1 align-self-center" length="24" thickness="2" vertical></v-divider>

      <!-- Action Controls -->
      <v-tooltip location="top" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="showOverlay ? '#76FF03' : '#42A5F5'"
            @click="handleClick('overlay')"
            size="small"
          >{{ showOverlay ? 'mdi-layers-outline' : 'mdi-layers-off-outline' }}</v-icon>
        </template>
        <span>{{ showOverlay ? $t('common.overlayOff') : $t('common.overlayOn') }}</span>
      </v-tooltip>

      <v-tooltip location="top" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-icon 
            v-bind="tooltipProps" 
            color="#FFD600" 
            @click="handleClick('lock')"
            size="small"
          >mdi-lock</v-icon>
        </template>
        <span>{{ $t('common.send') }} Ctrl+Alt+Del</span>
      </v-tooltip>

      <v-tooltip v-if="!isFullscreen" location="top" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-icon 
            v-bind="tooltipProps" 
            @click="toggleFullscreen"
            size="small"
          >mdi-fullscreen</v-icon>
        </template>
        <span>{{ $t('common.fullscreenMode') }}</span>
      </v-tooltip>

      <v-divider class="mx-1 align-self-center" length="24" thickness="2" vertical></v-divider>

      <!-- Layout Menu -->
      <v-menu offset-y>
        <template v-slot:activator="{ props: menuProps }">
          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="{ ...menuProps, ...tooltipProps }"
                :color="settings.isVisible || footer.showFooter ? '#76FF03' : 'white'"
                size="small"
              >mdi-view-dashboard</v-icon>
            </template>
            <span>Layout controls</span>
          </v-tooltip>
        </template>
        <v-list density="compact">
          <v-list-item @click="handleLayoutClick('left')">
            <template v-slot:prepend>
              <v-icon :color="settings.isVisible ? '#76FF03' : ''">mdi-dock-left</v-icon>
            </template>
            <v-list-item-title>Toggle Settings</v-list-item-title>
          </v-list-item>
          <v-list-item @click="handleLayoutClick('bottom')">
            <template v-slot:prepend>
              <v-icon :color="footer.showFooter ? '#76FF03' : ''">mdi-dock-bottom</v-icon>
            </template>
            <v-list-item-title>Toggle Footer</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- User Menu -->
      <v-menu offset-y>
        <template v-slot:activator="{ props: menuProps }">
          <v-tooltip location="top" content-class="">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon
                v-bind="{ ...menuProps, ...tooltipProps }"
                color="white"
                size="small"
              >mdi-account-circle</v-icon>
            </template>
            <span>{{ account.user }}</span>
          </v-tooltip>
        </template>
        <v-list density="compact">
          <template v-for="item in menuItems" :key="item.id">
            <v-divider v-if="item.isDivider"></v-divider>
            <v-list-item v-else @click="handleUserClick(item.id)">
              <template v-slot:prepend>
                <v-icon>{{ item.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ $t(item.titleKey) }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>

      <AppToolbarOperations v-if="!device?.isDisconnected" />
      <AppToolbarExpanded />
    </template>

    <template #append>
      <v-icon color="#76FF03" @click.stop="toggleToolbarExpansion">
        {{ toolbar.expanded ? 'mdi-chevron-double-left' : 'mdi-chevron-double-right' }}
      </v-icon>
    </template>
  </v-toolbar>
</template>

<script setup>
  import { useAppStore } from '@/stores/stores';
  import { storeToRefs } from 'pinia';
  import { useDevice } from '@/composables/useDevice';
  import { useAppKVMVideo } from '@/composables/useAppKVMVideo';
  import { useHealthCheck } from '@/composables/useHealthCheck.js';
  import { useHeaderMenu } from '@/composables/useHeaderMenu';
  import { useDragHandle, DRAG_CONSTANTS } from '@/composables/useDragHandle';
  import { useFullscreen } from '@/composables/useFullscreen';
  import { onMounted, onBeforeUnmount, ref, computed, nextTick } from 'vue';

  const store = useAppStore();

  const { settings, footer, toolbar, showOverlay, showCtrlAltDelDialog, systeminfo } =
    storeToRefs(store);

  const { device } = useDevice();
  const { isVideoActive } = useAppKVMVideo(device);
  const { healthIconColor } = useHealthCheck();
  
  // Header menu functionality
  const { account, menuItems, handleLayoutClick, handleUserClick } = useHeaderMenu();

  // Fullscreen functionality
  const { isFullscreen, toggleFullscreen } = useFullscreen({
    onEnter: () => {
      settings.value.isVisible = false;
      toolbar.value.visible = false;
      toolbar.value.pinned = false;
      footer.value.showFooter = false;
    },
    onExit: () => {
      toolbar.value.pinned = true;
      toolbar.value.visible = true;
      footer.value.showFooter = true;
    }
  });

  // Template refs
  const toolbarRef = ref(null);
  const dragHandleRef = ref(null);

  // Drag functionality
  const { 
    isDragging, 
    dragStyle, 
    handleStyle, 
    handleMouseDown: dragHandleMouseDown, 
    handleKeyDown: dragHandleKeyDown, 
    handleResize: dragHandleResize,
    initialize: initializeDrag 
  } = useDragHandle({
    target: toolbar,
    onToggle: () => pinMenu(),
    onDoubleClick: () => { toolbar.value.offset = 0; },
    calculateMaxOffset: () => {
      if (!toolbarRef.value?.$el) return DRAG_CONSTANTS.DEFAULT_MAX_OFFSET;
      const toolbarWidth = toolbarRef.value.$el.offsetWidth;
      const viewportWidth = window.innerWidth;
      return Math.max(DRAG_CONSTANTS.MIN_MAX_OFFSET, (viewportWidth - toolbarWidth) / 2 - DRAG_CONSTANTS.MIN_SAFE_MARGIN);
    }
  });

  // Computed styles
  const toolbarStyle = computed(() => ({
    left: '50%',
    transform: `translateX(calc(-50% + ${toolbar.value.offset}px))`,
    ...dragStyle.value
  }));

  const unifiedHandleStyle = computed(() => ({
    ...handleStyle.value,
    cursor: toolbar.value.pinned ? 'pointer' : handleStyle.value.cursor,
    marginRight: '4px',
    transition: 'transform 0.2s ease'
  }));

  const pinMenu = () => {
    toolbar.value.pinned = !toolbar.value.pinned;
    if (toolbar.value.pinned) {
      toolbar.value.visible = true; // Keep toolbar always visible when pinned
    }
    // When unpinned, toolbar will use proximity-based auto-hide from Matrix.vue
  };

  const toggleToolbarExpansion = () => {
    if (!toolbar.value) return;
    toolbar.value.expanded = !toolbar.value.expanded;
  };


  const handleClick = (value) => {
    switch (value) {
      case 'settings':
        settings.value.isVisible = !settings.value.isVisible;
        break;
      case 'overlay':
        showOverlay.value = !showOverlay.value;
        break;
      case 'lock':
        store.showCtrlAltDelDialog = true;
        break;

      default:
        break;
    }
  };

  // Unified handle functionality - delegate to drag composable
  const handleMouseDown = (event) => {
    // Only allow dragging when not pinned
    if (!toolbar.value.pinned) {
      dragHandleMouseDown(event);
    } else {
      // When pinned, handle click for unpinning
      event.preventDefault();
      event.stopPropagation();
      pinMenu();
    }
  };

  // Keyboard accessibility - delegate to drag composable
  const handleKeyDown = dragHandleKeyDown;

  // Reset position on window resize - delegate to drag composable
  const handleResize = dragHandleResize;

  onMounted(async () => {
    window.addEventListener('resize', handleResize);
    await initializeDrag();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
  });
</script>

<style scoped>
  .pin-active {
    color: #76ff03;
  }

  .unified-handle {
    transition: all 0.2s ease;
  }

  .unified-handle:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }

  .unified-handle:focus {
    outline: 2px solid #76ff03;
    outline-offset: 2px;
  }

  .unified-handle:active {
    transform: scale(0.95);
  }

  .toolbar-auto-hide {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  /* Smooth auto-hide animation */
  .toolbar-auto-hide[style*="display: none"] {
    opacity: 0;
    transform: translateY(-10px);
  }

  .toolbar-collapsed {
    position: fixed;
    left: 50%;
    top: 7px;
    transform: translateX(-50%);
    border-radius: 30px;
    background-color: var(--v-primary-base);
    z-index: 1000;
    transition:
      opacity 0.3s ease,
      top 0.3s ease;
    display: flex;
    /* Ensure elements like icons stay in one line */
    justify-content: center;
    /* Center content */
    align-items: center;
    /* Center vertically */
    width: auto;
    height: auto;
    white-space: nowrap;
    /* Prevent text and icons from wrapping */
    overflow: hidden;
  }

  .toolbar-expanded {
    position: fixed;
    flex-grow: 1;
    left: 50%;
    top: 7px;
    transform: translateX(-50%);
    border-radius: 30px;
    background-color: var(--v-primary-base);
    z-index: 1000;
    transition:
      opacity 0.3s ease,
      top 0.3s ease;
    display: flex;
    /* Ensure elements like icons stay in one line */
    justify-content: center;
    /* Center content */
    align-items: center;
    /* Center vertically */
    gap: 8px;
    /* Adds space between icons and text if needed */
    width: auto;
    height: auto;
    white-space: nowrap;
    /* Prevent text and icons from wrapping */
    overflow: hidden;
  }

  .ml-2 {
    margin-left: 8px;
  }
</style>
