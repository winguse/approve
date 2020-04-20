<template>
  <q-page class="flex flex-center">
    <q-card>
      <q-list>
        <q-item @click="click(info)" clickable v-for="info in pullRequests" v-bind:key="info.key">
          <q-item-section avatar>
            <q-icon :color="info.unread ? 'primary' : 'grey'" :name="info.unread ? 'markunread' : 'drafts'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ info.title }}</q-item-label>
            <q-item-label caption>{{ info.repoLogin }} / {{ info.repo }} #{{ info.number }} (<time-from-now :ts="info.updatedAt.getTime()" />)</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<style>
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'
import { StoreRoot } from '../store/index.d'
import { PullRequestInfo } from '../store/pullRequests/index.d'
import TimeFromNow from '../components/TimeFromNow.vue'

@Component({
  components: { TimeFromNow }
})
export default class PullRequests extends Vue {
  private get store () {
    const store: Store<StoreRoot> = this.$store
    return store
  }

  public beforeCreate () {
    this.$store.dispatch('pullRequests/list')
  }

  get pullRequests () {
    return this.store.state.pullRequests.infos
  }

  public click (info: PullRequestInfo) {
    this.$router.push(`/${info.repoLogin}/${info.repo}/pull/${info.number}`)
  }
}
</script>
