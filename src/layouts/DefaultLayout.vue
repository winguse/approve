<template>
  <q-layout view="hhh Lpr lFf">
    <q-header>
      <q-toolbar
        color="primary"
        :glossy="$q.theme === 'mat'"
        :inverted="$q.theme === 'ios'"
      >
        <q-breadcrumbs active-color="white" color="light">
          <q-breadcrumbs-el  icon="home" label="Approve" to="/" />
          <q-breadcrumbs-el v-for="path in paths" :label="path" :key="path"/>
        </q-breadcrumbs>
        <q-space />

        <q-btn
          flat
          dense
          round
          v-if="githubUrl"
          type="a" :href="githubUrl" target="_blank"
          aria-label="Open on Github"
        >
          <q-icon name="ion-logo-github" />
        </q-btn>
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

  get githubUrl () {
    // @ts-ignore
    const { owner, repo, pullId }: { owner: string; repo: string; pullId: string } = this.$route.params
    if (repo) {
      return `https://github.com/${owner}/${repo}/pull/${pullId}`
    }
    return ''
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
      return [owner, repo]
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
