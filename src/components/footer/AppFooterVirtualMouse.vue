<template>
  <!-- Virtual Mouse Section (when needed) -->
  <v-row v-if="showVirtualMouse" dense no-gutters align="center" class="w-100" style="margin: 0; width: 100%;">
    <v-col cols="12" class="d-flex justify-center align-center pa-0" style="max-width: none; text-align: center;">
      <VirtualMouse />
    </v-col>
  </v-row>
</template>

<script setup>
  import VirtualMouse from '@/components/VirtualMouse.vue';

  // Props
  defineProps({
    showVirtualMouse: {
      type: Boolean,
      required: true,
    },
  });
</script>
