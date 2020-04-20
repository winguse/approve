<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class App extends Vue {
  public beforeCreate () {
    this.$store.dispatch('config/scheduleCleanUp')
  }
}
</script>

<style>
</style>
