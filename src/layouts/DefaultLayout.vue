<template>
  <q-layout view="hhh Lpr lFf">
    <q-header>
      <q-toolbar
        color="primary"
        :glossy="$q.theme === 'mat'"
        :inverted="$q.theme === 'ios'"
      >
        <q-breadcrumbs active-color="white" color="light" v-if="paths.length > 0">
          <q-breadcrumbs-el v-for="path in paths" :label="path" :key="path"/>
        </q-breadcrumbs>
        <span v-else>
          {{ title }}
        </span>
        <q-space />
        <q-btn
          flat
          dense
          round
          @click="configOpened = true"
          aria-label="Settings"
        >
          <q-icon name="settings" />
        </q-btn>
      </q-toolbar>
      <router-view name="insideHeader" />
      <configurations v-model="configOpened" />
    </q-header>

    <router-view name="left" />
    <router-view name="right" />

    <q-page-container>
      <router-view />
    </q-page-container>

    <router-view name="footer" />

  </q-layout>
</template>

<script lang="ts">
import { openURL } from 'quasar'
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'
import Configurations from '../components/Configurations.vue'
import { StoreRoot } from '../store/index.d'

@Component({
  components: { Configurations }
})
export default class CommitSelector extends Vue {
  private get store () {
    const store: Store<StoreRoot> = this.$store
    return store
  }

  public data () {
    return {
      configOpened: !localStorage.getItem('token')
    }
  }

  get title () {
    // @ts-ignore
    const titleFromRoute: string = this.$route.meta.title
    return titleFromRoute
  }

  get paths () {
    // @ts-ignore
    const { owner, repo }: { owner: string; repo: string } = this.$route.params
    if (repo) {
      return ['Approve', owner, repo]
    }
    return []
  }

  public openURL (url: string) {
    openURL(url)
  }
}
</script>

<style>
</style>
