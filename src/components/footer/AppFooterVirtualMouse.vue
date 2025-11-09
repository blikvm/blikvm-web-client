<template>
  <!-- Virtual Mouse Section (when needed) -->
  <v-row v-if="showVirtualMouse" dense no-gutters align="center" class="w-100" style="margin: 0; width: 100%;">
    <v-col cols="12" class="position-relative pa-0" style="min-height: 60px;">
      <div class="d-flex justify-center w-100" style="position: absolute; left: 0; right: 0;">
        <VirtualMouse />
      </div>
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
