<template>
  <q-page padding class="row q-col-gutter-xl">
    <div v-for="item in items" :key="item.title" class="col-6">
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">{{ item.title }}</div>
          <div class="text-subtitle2">{{ item.subtitle }}</div>
        </q-card-section>
        <q-list>
          <q-item @click="click(info)" clickable v-for="info in item.prs" v-bind:key="info.key" :class="info.unread ? 'bg-blue-1' : ''">
            <q-item-section avatar>
              <q-icon :color="getColorFromState(info.state)" :name="info.state === 'MERGED' ? 'ion-git-merge' : 'ion-git-pull-request'" />
            </q-item-section>
            <q-item-section avatar>
              <q-avatar v-if="info.authorAvatar">
                <img :src="info.authorAvatar">
              </q-avatar>
              <q-icon v-if="!info.authorAvatar" color="grey" name="account_circle" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ info.title }}</q-item-label>
              <q-item-label caption>{{ info.repoLogin }} / {{ info.repo }} #{{ info.number }} (<time-from-now :ts="info.updatedAt.getTime()" />)</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
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

  public getColorFromState (state: any) {
    if (state === 'OPEN') return 'green'
    if (state === 'CLOSED') return 'red'
    if (state === 'MERGED') return 'purple'
    return 'grey'
  }

  public beforeCreate () {
    this.$store.dispatch('pullRequests/list')
  }

  get items () {
    return [{
      title: 'Notifications',
      subtitle: 'PR find from your notifications',
      prs: this.store.state.pullRequests.notifications
    }, {
      title: 'Your PRs',
      subtitle: 'PR directly related to you',
      prs: this.store.state.pullRequests.yourPRs
    }]
  }

  public click (info: PullRequestInfo) {
    if (info.unread) {
      this.$store.dispatch('pullRequests/markRead', info.threadId)
    }
    this.$router.push(`/${info.repoLogin}/${info.repo}/pull/${info.number}`)
  }
}
</script>
