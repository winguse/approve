<template>
  <div style="padding: 1em 4em" v-if="maxIndex >= 0">
    <q-range
      v-model.lazy="rangeValues"
      :error="rangeValues.min === rangeValues.max"
      :min="-1"
      :max="maxIndex"
      :step="1"
      :left-label-value="selectedStartCommit"
      :right-label-value="selectedEndCommit"
      markers
      snap
      label-always
      drag-range
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
    const {commitShaList, mergeTo: {sha}} = this.store.state.pullRequests;
    const selectedStartCommit = min === -1 ? sha : commitShaList[min];
    const selectedEndCommit = commitShaList[max];
    this.store.dispatch('pullRequests/updateSelectedCommits', {
      selectedStartCommit,
      selectedEndCommit,
    });
  }
  get selectedStartCommit() {
    const {selectedStartCommit, mergeTo: {branch, sha}} = this.store.state.pullRequests;
    if (selectedStartCommit === sha) {
      return branch;
    }
    return selectedStartCommit.slice(0, 6);
  }
  get selectedEndCommit() {
    return this.store.state.pullRequests.selectedEndCommit.slice(0, 6);
  }
}
</script>
