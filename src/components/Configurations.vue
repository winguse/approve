<template>
  <q-dialog v-model="opened" content-css="padding: 1em" no-backdrop-dismiss no-esc-dismiss no-route-dismiss>
    <q-card>
      <q-card-section>
        <h6>Configurations</h6>
        <p>Generate your Github token <a href="https://github.com/settings/tokens/new?scopes=repo&amp;description=Approve-PR-Too" target="_blank">here</a>.</p>
        <p><q-input float-label="Token" v-model="token" /></p>
        <p>
          <q-btn color="primary" @click="opened = false" label="OK" :disable="!token" />
          <!-- <q-btn label="Clear" @click="clear" /> -->
        </p>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { openURL } from 'quasar'
import { mapActions } from 'vuex'
import { mapGetterSetter } from '../utils'

export default {
  name: 'Configurations',
  props: ['value'],
  computed: {
    ...mapGetterSetter('config', ['token']),
    opened: {
      // @ts-ignore
      get () {
        // @ts-ignore
        return this.value
      },
      // @ts-ignore
      set (v) {
        // @ts-ignore
        this.$emit('input', v)
      }
    }
  },
  methods: {
    openURL,
    ...mapActions('config', [
      'clear'
    ])
  }
}
</script>
