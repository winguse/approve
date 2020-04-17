<template>
  <q-drawer side="left" :overlay="false" v-model="showTree" content-class="column">
    <q-tree
      class="affected-files"
      :nodes="tree"
      :selected.sync="selectedFile"
      :expanded.sync="expandedDir"
      label-key="name"
      node-key="fullPath"
      default-expand-all
    />

    <div class="over-all">content</div>
  </q-drawer>
</template>

<style>
.affected-files {
  margin-bottom: auto;
}
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

  get selectedFile () {
    return this.store.state.pullRequests.selectedFile
  }

  set selectedFile (file) {
    if (!file) {
      return
    }
    if (file.endsWith('/')) {
      let expanded = [...this.expandedDir]
      if (!expanded.includes(file)) {
        expanded.push(file)
      } else {
        expanded = expanded.filter(x => x !== file)
      }
      this.store.commit('pullRequests/setExpendedDir', expanded)
    } else {
      this.store.dispatch('pullRequests/selectFile', file)
    }
  }

  get expandedDir () {
    return this.store.state.pullRequests.expendedDir
  }

  set expandedDir (expended) {
    this.store.commit('pullRequests/setExpendedDir', expended)
  }

  get tree () {
    return this.store.state.pullRequests.tree
  }

  public data () {
    return {
      showTree: true
    }
  }
}
</script>
