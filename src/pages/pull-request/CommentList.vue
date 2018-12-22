<template>
  <q-layout-drawer side="right" v-model="showCommentList">
    comment list
  </q-layout-drawer>
</template>

<style>
</style>

<script lang="ts">
export default {
  name: 'CommentList',
  data() {
    return {showCommentList: true};
  },
};
</script>
