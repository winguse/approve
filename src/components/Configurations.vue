<template>
  <q-modal v-model="opened" content-css="padding: 1em">
    <h6>Configurations</h6>
    <p><q-input float-label="Token" v-model="token" /></p>
    <p>
      <q-btn color="primary" @click="opened = false" label="OK" />
      <q-btn label="Clear" @click="clear" />
    </p>
  </q-modal>
</template>

<script lang="ts">
import { openURL } from 'quasar';
import { mapActions, mapState } from 'vuex';
import { mapGetterSetter } from '../utils';

export default {
  name: 'Configurations',
  props: ['value'],
  computed: {
    ...mapGetterSetter('config', ['token']),
    opened: {
      // @ts-ignore
      get() {
        // @ts-ignore
        return this.value;
      },
      // @ts-ignore
      set(v) {
        // @ts-ignore
        this.$emit('input', v);
      },
    },
  },
  methods: {
    openURL,
    ...mapActions('config', [
      'clear',
    ]),
  },
};
</script>
