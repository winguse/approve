<template>
  <div style="background: #eee">
    compare diff stuffs
  </div>
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
    this.$store.dispatch('pullRequests/loead', { owner, repo, pullId });
  },
};
</script>
