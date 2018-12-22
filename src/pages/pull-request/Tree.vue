<template>
  <q-layout-drawer side="left" :overlay="false" v-model="showTree">
    tree
  </q-layout-drawer>
</template>

<style>
</style>

<script lang="ts">
export default {
  name: 'Tree',
  data() {
    return {showTree: true};
  },
};
</script>

