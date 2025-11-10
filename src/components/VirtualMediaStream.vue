<template>
  <v-card class="custom-card-disabled__TODO mx-auto wrap-text" width="auto" @click.stop>
    <v-sheet elevation="5" class="inner-sheet pa-4 mx-auto" width="100%">
      <v-sheet class="scrollable-container pa-4 text-center mx-auto" max-width="800" width="100%">
        <v-form ref="form">
          <v-row dense no-gutters class="d-flex justify-start align-center">
            <v-col cols="auto" class="d-flex align-center">
              <TextField
                v-model="streamUrl"
                :label="$t('msd.streamSourceUrl')"
                style="width: 250px"
              />
            </v-col>

            <v-col>
              <!--       :disabled="!url || url.length === 0"-->
              <v-btn
                v-ripple
                :loading="isLoading"
                :disabled="isLoading"
                color="#76FF03"
                variant="outlined"
                @click="handleClick('mountStream')"
              >
                Mount
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-sheet>
    </v-sheet>
  </v-card>
</template>

<script setup>
  import { ref } from 'vue';

  const streamUrl = ref('https://');
  const isLoading = ref(false);
</script>
