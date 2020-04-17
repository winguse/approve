<template>
  <q-drawer side="right" :overlay="true" v-model="showCommentList">
    comment list
  </q-drawer>
</template>

<style>
</style>

<script lang="ts">
export default {
  name: 'CommentList',
  data () {
    return { showCommentList: false }
  }
}
</script>
