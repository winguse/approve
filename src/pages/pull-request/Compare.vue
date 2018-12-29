<template>
  <table>
    <tbody>
    <tr v-for="change in changes" :key="change.idx" :class="{ added: change.added, removed: change.removed}">
      <td class="left-line-number" :data-txt="change.leftLineNumber"></td>
      <td class="right-line-number" :data-txt="change.rightLineNumber"></td>
      <td class="symbol"></td>
      <td><span v-for="(hightLight, idx) in change.hightLights" :key="idx" :class="hightLight.type">{{hightLight.value}}</span></td>
    </tr>
    </tbody>
  </table>
</template>

<style>
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Store } from 'vuex';
import { StoreRoot } from '../../store/index.d';

@Component
export default class CommitSelector extends Vue {
  private get store() {
    const store: Store<StoreRoot> = this.$store;
    return store;
  }

  public beforeCreate() {
    // @ts-ignore
    const { owner, repo, pullId }: { owner: string, repo: string, pullId: string } = this.$route.params;
    // @ts-ignore
    this.$store.dispatch('pullRequests/load', { owner, repo, pullId });
  }

  get changes() {
    return this.store.state.pullRequests.activeChanges;
  }
}
</script>
