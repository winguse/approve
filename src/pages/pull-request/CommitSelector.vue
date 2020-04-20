<template>
  <div style="padding: 1em 4em; background: #fff" v-if="maxIndex >= 0">
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
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'
import { StoreRoot } from '../../store/index.d'

@Component
export default class CommitSelector extends Vue {
  private get store () {
    const store: Store<StoreRoot> = this.$store
    return store
  }

  get maxIndex () {
    return this.store.state.pullRequest.commitShaList.length - 1
  }

  get rangeValues () {
    const { selectedStartCommit, selectedEndCommit, commitShaList } = this.store.state.pullRequest
    const min = commitShaList.indexOf(selectedStartCommit)
    const max = commitShaList.indexOf(selectedEndCommit)
    return { min, max }
  }

  set rangeValues ({ min, max }: {min: number; max: number}) {
    const { commitShaList, mergeTo: { branch } } = this.store.state.pullRequest
    const selectedStartCommit = min === -1 ? branch : commitShaList[min]
    const selectedEndCommit = commitShaList[max]
    this.store.dispatch('pullRequest/updateSelectedCommits', {
      selectedStartCommit,
      selectedEndCommit
    })
  }

  get selectedStartCommit () {
    const { selectedStartCommit, mergeTo: { branch } } = this.store.state.pullRequest
    if (selectedStartCommit === branch) {
      return branch
    }
    return selectedStartCommit.slice(0, 6)
  }

  get selectedEndCommit () {
    return this.store.state.pullRequest.selectedEndCommit.slice(0, 6)
  }
}
</script>
