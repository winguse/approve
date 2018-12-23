<template>
  <q-layout-drawer side="right" :overlay="true" v-model="showCommentList">
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
