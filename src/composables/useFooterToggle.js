import { ref } from 'vue';

/**
 * Composable for managing footer toggle state and mutual exclusivity
 * Handles complex logic for keyboard vs terminals vs notifications
 */
export function useFooterToggle(initialSelection = ['video']) {
  const activeToggle = ref([...initialSelection]);

  /**
   * Handle toggle changes with mutual exclusivity rules
   * @param {Array} selectedValues - Array of selected toggle IDs
   */
  const handleToggleChange = (selectedValues) => {
    console.log('⚡ useFooterToggle handleToggleChange called with:', selectedValues);
    console.log('⚡ Current activeToggle before:', activeToggle.value);
    
    let corrected = [...selectedValues];
    
    // Mutual exclusivity rules - MOST RECENT ITEM WINS:
    // Determine what the user just clicked (newest item)
    const oldToggle = activeToggle.value;
    const newItem = corrected.find(val => !oldToggle.includes(val));
    
    console.log('⚡ User clicked:', newItem);
    console.log('⚡ Previous active items:', oldToggle);
    
    if (newItem === "notifications") {
      console.log('⚡ Notifications clicked: exclude everything else');
      corrected = corrected.filter(val => val === "video" || val === "notifications");
    } else if (newItem === "keyboard") {
      console.log('⚡ Keyboard clicked: exclude terminals and notifications');
      corrected = corrected.filter(val => !["console", "serial", "notifications"].includes(val));
    } else if (newItem === "console" || newItem === "serial") {
      console.log('⚡ Terminal clicked: exclude keyboard and notifications');
      corrected = corrected.filter(val => !["keyboard", "notifications"].includes(val));
    } else {
      // No new exclusive item clicked - just maintain current state
      console.log('⚡ No exclusive item clicked or toggling off');
    }
    // Note: Mouse has no exclusions - it can coexist with keyboard, terminals, or be standalone
    
    console.log('⚡ Corrected values:', corrected);
    activeToggle.value = corrected;
    console.log('⚡ activeToggle after update:', activeToggle.value);
  };

  /**
   * Check if a specific item is selected
   * @param {string} itemId - The item ID to check
   * @returns {boolean}
   */
  const isSelected = (itemId) => {
    return activeToggle.value.includes(itemId);
  };

  /**
   * Add an item to the toggle selection
   * @param {string} itemId - The item ID to add
   */
  const addToToggle = (itemId) => {
    if (!activeToggle.value.includes(itemId)) {
      handleToggleChange([...activeToggle.value, itemId]);
    }
  };

  /**
   * Remove an item from the toggle selection
   * @param {string} itemId - The item ID to remove
   */
  const removeFromToggle = (itemId) => {
    const filtered = activeToggle.value.filter((val) => val !== itemId);
    handleToggleChange(filtered);
  };

  /**
   * Toggle an item (add if not present, remove if present)
   * @param {string} itemId - The item ID to toggle
   */
  const toggleItem = (itemId) => {
    if (isSelected(itemId)) {
      removeFromToggle(itemId);
    } else {
      addToToggle(itemId);
    }
  };

  /**
   * Reset toggle to initial state
   */
  const resetToggle = () => {
    activeToggle.value = [...initialSelection];
  };

  /**
   * Set toggle to specific selection
   * @param {Array} selection - Array of item IDs to select
   */
  const setToggle = (selection) => {
    handleToggleChange([...selection]);
  };

  return {
    activeToggle,
    handleToggleChange,
    isSelected,
    addToToggle,
    removeFromToggle,
    toggleItem,
    resetToggle,
    setToggle,
  };
}
