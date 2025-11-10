import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { useSessionUtils } from '@/composables/useSessionUtils';
import { useDevice } from '@/composables/useDevice';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

// Header menu positioning constants
const HEADER_MENU_CONSTANTS = {
  RIGHT_OFFSET: 10, // pixels
};

export function useHeaderMenu() {
  const store = useAppStore();
  const { device } = useDevice();
  const { settings, footer, toolbar, showManageAccountDialog, showAboutPageDialog, account } =
    storeToRefs(store);
  const { inactivateDevice } = useSessionUtils(device);
  const router = useRouter();

  // Computed style for header menu positioning
  const headerMenuStyle = computed(() => ({
    right: `calc(${HEADER_MENU_CONSTANTS.RIGHT_OFFSET}px - ${toolbar.value.offset}px)`,
    transition: 'right 0.2s ease-out',
  }));

  const handleLayoutClick = (action) => {
    switch (action) {
      case 'left':
        settings.value.isVisible = !settings.value.isVisible;
        break;
      case 'bottom':
        footer.value.showFooter = !footer.value.showFooter;
        break;
      default:
        break;
    }
  };

  const menuItems = [
    {
      id: 'about',
      icon: 'mdi-information-outline',
      titleKey: 'appFooter.about',
      action: () => {
        showAboutPageDialog.value = true;
      },
    },
    {
      id: 'account',
      icon: 'mdi-account',
      titleKey: 'account.title',
      action: () => {
        showManageAccountDialog.value = true;
      },
    },
    {
      id: 'divider',
      isDivider: true,
    },
    {
      id: 'logout',
      icon: 'mdi-logout',
      titleKey: 'login.logout',
      action: () => {
        inactivateDevice();
        router.push('/');
      },
    },
  ];

  const handleUserClick = (action) => {
    const item = menuItems.find((item) => item.id === action);
    if (item && item.action) {
      item.action();
    }
  };

  return {
    // Store refs
    account,
    settings,
    footer,
    showManageAccountDialog,
    showAboutPageDialog,

    // Menu data
    menuItems,

    // Computed styles
    headerMenuStyle,

    // Actions
    handleLayoutClick,
    handleUserClick,
  };
}
