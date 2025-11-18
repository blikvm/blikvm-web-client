<template>
  <v-toolbar
    v-if="toolbar.visible || toolbar.pinned"
    ref="toolbarRef"
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
        <v-icon
          ref="dragHandleRef"
          color="#76FF03"
          :class="{ 'pin-active': toolbar.pinned }"
          class="unified-handle"
          role="button"
          tabindex="0"
          :aria-label="toolbar.pinned ? 'Pinned' : 'Draggable'"
          :style="unifiedHandleStyle"
          @mousedown="handleMouseDown"
          @keydown="handleKeyDown"
        >
          {{ toolbar.pinned ? 'mdi-pin' : 'mdi-drag' }}
        </v-icon>
      </div>
    </template>

    <slot name="toolbar-title">
      <span style="text-transform: none; margin-left: 4px">
        {{ systeminfo.hostname }}
      </span>
    </slot>

    <template v-if="$vuetify.display.smAndUp">
      <v-divider
        class="mx-1 align-self-center"
        length="24"
        thickness="2"
        vertical
      />
    </template>

    <!-- LAN Connectivity Status (always visible) -->
    <v-tooltip
      location="top"
      content-class=""
    >
      <template #activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          :color="device.isDisconnected ? '#D32F2F' : '#76FF03'"
          class="toolbar-icon"
          size="small"
        >
          {{ device.isDisconnected ? 'mdi-lan-disconnect' : 'mdi-lan-connect' }}
        </v-icon>
      </template>
      <span>{{ device.isDisconnected ? $t('common.disconnect') : $t('common.connect') }}</span>
    </v-tooltip>

    <!-- Health Status (always visible when connected) -->
    <v-tooltip
      v-if="!device?.isDisconnected"
      location="top"
      content-class=""
    >
      <template #activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          :color="healthIconColor"
          class="toolbar-icon"
          size="small"
        >
          mdi-heart-pulse
        </v-icon>
      </template>
      <span>{{ device.health.status }}</span>
    </v-tooltip>

    <!-- Expanded Controls Section -->
    <template v-if="toolbar.expanded">
      <!-- KVM Status Icons -->
      <v-tooltip
        v-if="!device?.isDisconnected"
        location="top"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="device.hid.isActive && device.hid.keyboard.isActive ? '#76FF03' : '#D32F2F'"
            size="small"
          >
            mdi-keyboard
          </v-icon>
        </template>
        <span>{{ $t('common.keyboard') }}
          {{
            device.hid.isActive && device.hid.keyboard.isActive
              ? $t('common.active')
              : $t('common.inactive')
          }}</span>
      </v-tooltip>

      <v-tooltip
        v-if="!device?.isDisconnected"
        location="top"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="isVideoActive ? '#76FF03' : '#D32F2F'"
            size="small"
          >
            mdi-monitor
          </v-icon>
        </template>
        <span>{{ $t('settings.device.video.title') }}
          {{ isVideoActive ? $t('common.active') : $t('common.inactive') }}</span>
      </v-tooltip>

      <v-tooltip
        v-if="!device?.isDisconnected"
        location="top"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="device.hid.isActive && device.hid.mouse.isActive ? '#76FF03' : '#D32F2F'"
            size="small"
          >
            mdi-mouse
          </v-icon>
        </template>
        <span>{{ $t('common.mouse') }}
          {{
            device.hid.isActive && device.hid.mouse.isActive
              ? $t('common.active')
              : $t('common.inactive')
          }}</span>
      </v-tooltip>

      <!-- Action Controls -->
      <v-tooltip
        location="top"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="!isVideoActive ? '#9E9E9E' : showOverlay ? '#76FF03' : '#42A5F5'"
            :class="{ 'cursor-not-allowed': !isVideoActive }"
            size="small"
            @click="handleClick('overlay')"
          >
            {{ showOverlay ? 'mdi-layers-outline' : 'mdi-layers-off-outline' }}
          </v-icon>
        </template>
        <span>{{ !isVideoActive ? $t('common.noVideoFeed') : showOverlay ? $t('common.overlayOff') : $t('common.overlayOn') }}</span>
      </v-tooltip>

      <v-tooltip
        location="top"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            color="#FFD600"
            size="small"
            @click="handleClick('lock')"
          >
            mdi-lock
          </v-icon>
        </template>
        <span>{{ $t('common.send') }} Ctrl+Alt+Del</span>
      </v-tooltip>

      <v-tooltip
        v-if="!isFullscreen"
        location="top"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            size="small"
            @click="toggleFullscreen"
          >
            mdi-fullscreen
          </v-icon>
        </template>
        <span>{{ $t('common.fullscreenMode') }}</span>
      </v-tooltip>

      <AppToolbarOperations v-if="!device?.isDisconnected" />
      <AppToolbarExpanded />
    </template>

    <template #append>
      <!-- Settings Toggle -->
      <v-tooltip
        v-if="toolbar.expanded"
        location="top"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="settings.isVisible ? '#76FF03' : 'white'"
            size="small"
            @click="handleLayoutClick('left')"
          >
            mdi-dock-left
          </v-icon>
        </template>
        <span>{{ $t('common.toggleSettings') }}</span>
      </v-tooltip>

      <!-- Footer Toggle -->
      <v-tooltip
        v-if="toolbar.expanded"
        location="top"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            :color="footer.showFooter ? '#76FF03' : 'white'"
            size="small"
            @click="handleLayoutClick('bottom')"
          >
            mdi-dock-bottom
          </v-icon>
        </template>
        <span>{{ $t('common.toggleFooter') }}</span>
      </v-tooltip>

      <!-- User Menu -->
      <v-menu
        v-if="toolbar.expanded"
        offset-y
      >
        <template #activator="{ props: menuProps }">
          <v-tooltip
            location="top"
            content-class=""
          >
            <template #activator="{ props: tooltipProps }">
              <v-icon
                v-bind="{ ...menuProps, ...tooltipProps }"
                color="white"
                size="small"
              >
                mdi-account-circle
              </v-icon>
            </template>
            <span>{{ account.user || t('common.user') }}</span>
          </v-tooltip>
        </template>
        <v-list density="compact">
          <template
            v-for="item in menuItems"
            :key="item.id"
          >
            <v-divider v-if="item.isDivider" />
            <v-list-item
              v-else
              @click="handleUserClick(item.id)"
            >
              <template #prepend>
                <v-icon>{{ item.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ $t(item.titleKey) }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>

      <v-icon
        color="#76FF03"
        @click.stop="toggleToolbarExpansion"
      >
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
  import { onMounted, onBeforeUnmount, ref, computed, nextTick, watch } from 'vue';
  import { useI18n } from 'vue-i18n';

  const store = useAppStore();
  const { t } = useI18n();

  const { settings, footer, toolbar, showOverlay, systeminfo } = storeToRefs(store);

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
    },
  });

  // Template refs
  const toolbarRef = ref(null);
  const dragHandleRef = ref(null);

  // Drag functionality
  const {
    dragStyle,
    handleStyle,
    handleMouseDown: dragHandleMouseDown,
    handleKeyDown: dragHandleKeyDown,
    handleResize: dragHandleResize,
    initialize: initializeDrag,
  } = useDragHandle({
    target: toolbar,
    onToggle: () => pinMenu(),
    onDoubleClick: () => {
      toolbar.value.offset = 0;
    },
    calculateMaxOffset: () => {
      if (!toolbarRef.value?.$el) return DRAG_CONSTANTS.DEFAULT_MAX_OFFSET;
      const toolbarWidth = toolbarRef.value.$el.offsetWidth;
      const viewportWidth = window.innerWidth;
      return Math.max(
        DRAG_CONSTANTS.MIN_MAX_OFFSET,
        (viewportWidth - toolbarWidth) / 2 - DRAG_CONSTANTS.MIN_SAFE_MARGIN
      );
    },
  });

  // Computed styles
  const toolbarStyle = computed(() => ({
    left: '50%',
    transform: `translateX(calc(-50% + ${toolbar.value.offset}px))`,
    ...dragStyle.value,
  }));

  const unifiedHandleStyle = computed(() => ({
    ...handleStyle.value,
    cursor: toolbar.value.pinned ? 'pointer' : handleStyle.value.cursor,
    marginRight: '4px',
    transition: 'transform 0.2s ease',
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
        // Don't allow overlay toggle when there's no video feed
        if (isVideoActive.value) {
          showOverlay.value = !showOverlay.value;
        }
        break;
      case 'lock':
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

  // Auto-manage overlay state based on video feed
  watch(isVideoActive, (newValue) => {
    if (!newValue && showOverlay.value) {
      // Hide overlay when video feed stops
      showOverlay.value = false;
    }
    // Note: Don't auto-show overlay when video returns - let user manually enable
  });

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
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  /* Smooth auto-hide animation */
  .toolbar-auto-hide[style*='display: none'] {
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
