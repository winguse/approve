<template>
  <div class="comment"></div>
</template>

<style lang="stylus">
.comment {
  position: absolute;
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Store } from 'vuex';

@Component({
  props: {
    c: Object,
  },
})
export default class Comment extends Vue {
}
</script>
