<template>
  <v-btn-group v-ripple density="compact" rounded="lg" variant="tonal">
    <v-btn
      v-ripple
      class="flex-grow-1 text-none"
      prepend-icon="mdi-refresh"
      color="#76FF03"
      tile
      @click.stop="getACLState"
    >
      {{ $t('common.refresh') }}
    </v-btn>
  </v-btn-group>

  <div style="max-height: 265px; min-width: 100%; overflow-y: auto; overflow-x: hidden">
    <v-data-table
      :headers="headers"
      :items="ACLBlockList"
      item-value="ip"
      fixed-header
      :multi-sort="true"
      hide-default-footer
      :no-data-text="$t('dataIterator.noDataText')"
      :rows-per-page-text="$t('dataIterator.rowsPerPageText')"
      :page-text="$t('dataIterator.pageText')"
      :return-object="true"
    >
      <!-- <template v-slot:loading>
        <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
      </template> -->

      <!-- eslint-disable-next-line vue/valid-v-slot --><!-- Allow Vuetify's extended slot name syntax 'item.ip' -->
      <template #item.ip="{ item }">
        {{ item.ip }}
      </template>

      <!-- eslint-disable-next-line vue/valid-v-slot --><!-- Allow Vuetify's extended slot name syntax 'item.remove' -->
      <template #item.remove="{ item }">
        <v-btn-group
          v-ripple
          density="compact"
          rounded="lg"
          variant="tonal"
          group
          selected-class="selected-orientation"
        >
          <v-btn
            v-ripple
            class="flex-grow-1 text-none"
            flat
            prepend-icon="mdi-close"
            color="#D32F2F"
            tile
            @click.stop="handleRemove(item.ip)"
          >
            {{ $t('common.remove') }}
            <template #prepend>
              <v-icon color="#D32F2F" />
            </template>
          </v-btn>
        </v-btn-group>
      </template>
    </v-data-table>
  </div>

  <v-row dense class="d-flex justify-start align-center">
    <v-col cols="12">
      <v-text-field
        v-model="deviceName"
        v-ripple
        minlength="1"
        :rules="deviceNameRules"
        density="compact"
        tile
        rounded="lg"
        color="#76FF03"
        variant="outlined"
        placeholder="New IP address"
        hide-details
        single-line
        @keydown.stop
        @keyup.stop
      />
    </v-col>
  </v-row>

  <v-row dense class="d-flex justify-end align-center">
    <v-col cols="auto">
      <v-btn
        v-ripple
        class="flex-grow-1 text-none"
        prepend-icon="mdi-plus"
        color="#76FF03"
        tile
        rounded="lg"
        flat
        variant="tonal"
        @click.stop="handleAddClick()"
      >
        {{ $t('common.add') }}
        <template #prepend>
          <v-icon color="#76FF03" />
        </template>
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
  import { ref, onMounted } from 'vue';
  import { useACL } from '@/composables/useACL';
  import { useAlert } from '@/composables/useAlert';
  import { useWOL } from '@/composables/useWOL';

  const { deviceNameRules } = useWOL();
  const deviceName = ref('');
  const { sendAlert } = useAlert();
  const { ACLBlockList, getACLState, apiRemove, apiAdd } = useACL();

  const headers = ref([
    {
      title: 'IP address',
      align: 'start',
      sortable: true,
      key: 'ip',
    },
    {
      title: 'Blocked',
      align: 'start',
      sortable: true,
      key: 'ts',
    },
    {
      title: 'Action',
      align: 'start',
      key: 'remove',
    },
  ]);

  const handleRemove = (ip) => {
    apiRemove('block', ip);
  };

  const handleAddClick = () => {
    if (deviceName.value.trim() === '') {
      const title = 'Allow List Error';
      const message = 'IP address cannot be empty';
      sendAlert('error', title, message);
      return;
    }
    apiAdd('block', deviceName.value);
    deviceName.value = ''; // Clear the input field after adding
  };

  onMounted(() => {});
</script>
