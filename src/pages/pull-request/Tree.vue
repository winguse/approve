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
    >
      <template v-slot:default-header="prop">
        <div class="row items-center">
          <q-icon :name="prop.node.icon" class="q-mr-sm" color="blue-8" />
          <span class="text-primary">{{ prop.node.name }}</span>
          <q-badge v-if="prop.node.commentCount" color="red" class="q-ml-sm">{{ prop.node.commentCount }}</q-badge>
        </div>
      </template>
    </q-tree>

    <!-- <div class="over-all">
    </div> -->
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
    return this.store.state.pullRequest.selectedFile
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
      this.store.commit('pullRequest/setExpendedDir', expanded)
    } else {
      this.store.dispatch('pullRequest/selectFile', file)
    }
  }

  get expandedDir () {
    return this.store.state.pullRequest.expendedDir
  }

  set expandedDir (expended) {
    this.store.commit('pullRequest/setExpendedDir', expended)
  }

  get tree () {
    return this.store.state.pullRequest.tree
  }

  public data () {
    return {
      showTree: true
    }
  }
}
</script>
