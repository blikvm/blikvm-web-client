'use strict';

import { shallowRef } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';

const store = useAppStore();
const { misc } = storeToRefs(store);

export function useCursors() {
  const cursorList = shallowRef([
    {
      icon: 'mdi-cursor-default',
      cursor: 'default',
      label: 'default cursor',
      color: '',
    },
    {
      icon: 'mdi-cursor-move',
      cursor: 'grab',
      label: 'grab cursor',
      color: '',
    },
    { icon: 'mdi-plus', cursor: 'crosshair', label: 'cell cursor', color: '' },
    {
      icon: 'mdi-cursor-text',
      cursor: 'text',
      label: 'text cursor',
      color: '',
    },
    {
      icon: 'mdi-circle-medium',
      cursor: 'cursor-green-dot',
      label: 'green dot',
      color: '#76FF03',
    },
  ]);

  const changeCursor = (item) => {
    misc.value.currentCursor = item.cursor; // Update the current cursor in misc
    localStorage.setItem('cursorValue', item.cursor);
  };

  return {
    cursorList,
    changeCursor,
  };
}
