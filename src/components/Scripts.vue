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
  <v-sheet
    class="mx-auto wrap-text"
    @mouseenter.stop
    @mousemove.stop
    @keydown.stop
    @keypress.stop
    @keyup.stop
  >
    <v-file-upload
      divider-text="or choose locally"
      icon="mdi-upload"
      title="Drag & Drop or Click Here"
      clearable
      multiple
      show-size
      scrim
      tile
      density="compact"
    />
  </v-sheet>
</template>

<script setup>
  // Define the props and use v-model binding
  defineProps({
    label: { type: String, default: '' },
    index: { type: Number, default: 0 },
    modelValue: { type: Boolean, default: false }, // Auto-bound for v-model:is-menu-visible
  });

  defineEmits(['update:modelValue']);
</script>
