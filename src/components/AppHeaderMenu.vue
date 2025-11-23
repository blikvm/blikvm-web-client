<template>
  <v-toolbar
    height="30"
    elevation="10"
    app="false"
    dense
    short
    flat
    color="black"
    class="user-menu-toolbar"
    :style="headerMenuStyle"
  >
    <!-- Layout Controls Button Group -->
    <v-btn-group
      variant="elevated"
      color="black"
      class="layout-btn-group"
    >
      <v-tooltip
        location="bottom"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="layout-btn"
            :class="{ 'active-toggle': settings.isVisible }"
            icon
            size="small"
            variant="tonal"
            @click="handleLayoutClick('left')"
          >
            <v-icon :color="settings.isVisible ? '#76FF03' : 'white'">
              mdi-dock-left
            </v-icon>
          </v-btn>
        </template>
        <span>Toggle settings</span>
      </v-tooltip>

      <v-tooltip
        location="bottom"
        content-class=""
      >
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="layout-btn"
            :class="{ 'active-toggle': footer.showFooter }"
            icon
            size="small"
            variant="tonal"
            @click="handleLayoutClick('bottom')"
          >
            <v-icon :color="footer.showFooter ? '#76FF03' : 'white'">
              mdi-dock-bottom
            </v-icon>
          </v-btn>
        </template>
        <span>Toggle footer</span>
      </v-tooltip>
      <!--
      <v-tooltip location="bottom" content-class="">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            class="layout-btn"
            icon
            size="small"
            @click="handleLayoutClick('layout')"
          >
            <v-icon color="white">mdi-dock-right</v-icon>
          </v-btn>
        </template>
        <span>Layout mode</span>
      </v-tooltip>

-->
    </v-btn-group>

    <v-spacer />

    <!-- User Menu -->
    <v-menu offset-y>
      <template #activator="{ props: menuProps }">
        <v-tooltip
          location="bottom"
          content-class=""
        >
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="{ ...menuProps, ...tooltipProps }"
              class="user-menu-button"
              icon
              size="small"
              variant="elevated"
              color="black"
            >
              <v-icon color="white">
                mdi-account-circle
              </v-icon>
            </v-btn>
          </template>
          <span>{{ account.user || t('common.user') }} </span>
        </v-tooltip>
      </template>
      <v-list>
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
  </v-toolbar>
</template>

<script setup>
  import { useHeaderMenu } from '@/composables/useHeaderMenu';
  import { useI18n } from 'vue-i18n';

  const { t } = useI18n();
  const {
    account,
    settings,
    footer,
    menuItems,
    headerMenuStyle,
    handleLayoutClick,
    handleUserClick,
  } = useHeaderMenu();
</script>

<style scoped>
  .user-menu-toolbar {
    --header-menu-top-offset: 7px;

    position: fixed;
    top: var(--header-menu-top-offset);
    z-index: 999;
    width: auto;
    border-radius: 30px;
  }

  .layout-btn-group {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    border-radius: 16px;
    overflow: hidden;
  }

  .user-menu-button {
    border-radius: 50%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .layout-btn-group .v-btn {
    border-right: none !important;
  }

  .layout-btn-group .v-btn:not(:last-child) {
    border-right: none !important;
  }
</style>
