<template>
  <q-page class="flex flex-center" style="background: #eee">
    compare diff stuffs
  </q-page>
</template>

<style>
</style>

<script lang="ts">
export default {
  name: 'Compare',
  beforeCreate() {
    // @ts-ignore
    const { owner, repo, pullId }: { owner: string, repo: string, pullId: string } = this.$route.params;
    // @ts-ignore
    this.$store.dispatch('pullRequests/load', { owner, repo, pullId });
  },
};
</script>
