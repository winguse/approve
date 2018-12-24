<template>
  <div>
    <div v-for="change in changes" :key="change.idx" :style="'background: ' + change.color">
      <span>{{change.leftLine}}</span>
      <span>{{change.rightLine}}</span>
      <span>{{change.symbol}}</span>
      <span>{{change.value}}</span>
    </div>
  </div>
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
    let leftLine = 0;
    let rightLine = 0;
    return this.store.state.pullRequests.activeChanges
      .flatMap(({value, added, removed}) =>
        value.split('\n').map(v => ({value: v, added, removed})))
      .map(({value, added, removed}, idx) => {
      if (!added) { leftLine++; }
      if (!removed) { rightLine++; }
      if (added) {
        return {
          idx,
          leftLine: '',
          rightLine: `${rightLine}`,
          symbol: '+',
          color: 'green',
          value,
        };
      }
      if (removed) {
        return {
          idx,
          leftLine: `${leftLine}`,
          rightLine: '',
          symbol: '-',
          color: 'red',
          value,
        };
      }
      return {
        idx,
        leftLine: `${leftLine}`,
        rightLine: `${rightLine}`,
        symbol: '',
        color: 'white',
        value,
      };
    });
  }
}
</script>
