<template>
  <div style="padding: 1em" v-if="maxIndex >= 0">
    <q-range
      v-model="rangeValues"
      :error="rangeValues.min === rangeValues.max"
      :min="-1"
      :max="maxIndex"
      :step="1"
      :left-label-value="selectedStartCommit"
      :right-label-value="selectedEndCommit"
      markers
      snap
      label
    />
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

  get maxIndex() {
    return this.store.state.pullRequests.commitShaList.length - 1;
  }
  get rangeValues() {
    const { selectedStartCommit, selectedEndCommit, commitShaList} = this.store.state.pullRequests;
    const min = commitShaList.indexOf(selectedStartCommit);
    const max = commitShaList.indexOf(selectedEndCommit);
    return {min, max};
  }
  set rangeValues({min, max}: {min: number, max: number}) {
    const {commitShaList, mergeTo: {sha}, selectedStartCommit, selectedEndCommit} = this.store.state.pullRequests;
    const nextSelectedStartCommit = min === -1 ? sha : commitShaList[min];
    const nextSelectedEndCommit = commitShaList[max];
    if (nextSelectedStartCommit === selectedStartCommit && nextSelectedEndCommit === selectedEndCommit) {
      return;
    }
    this.store.dispatch('pullRequests/updateSelectedCommits', {
      selectedStartCommit: nextSelectedStartCommit,
      selectedEndCommit: nextSelectedEndCommit,
    });
  }
  get selectedStartCommit() {
    return this.store.state.pullRequests.selectedStartCommit;
  }
  get selectedEndCommit() {
    return this.store.state.pullRequests.selectedEndCommit;
  }
}
</script>
