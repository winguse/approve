<template>
  <q-page class="flex flex-center">
    pull request
  </q-page>
</template>

<style>
</style>

<script lang="ts">
export default {
  name: 'PullRequest',
  beforeCreate() {
    // get data
    // @ts-ignore
    const { owner, repo }: { owner: string, repo: string } = this.$route.params;
  },
};
</script>
