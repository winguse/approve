<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-toolbar
        color="primary"
        :glossy="$q.theme === 'mat'"
        :inverted="$q.theme === 'ios'"
      >
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
        >
          <q-icon name="menu" />
        </q-btn>

        <q-toolbar-title>
          {{ title }}
          <div slot="subtitle">
            <q-breadcrumbs active-color="white" color="light" v-if="paths.length > 0">
              <q-breadcrumbs-el v-for="path in paths" :label="path" :key="path"/>
            </q-breadcrumbs>
            <span v-else>
              Running on Quasar v{{ $q.version }}
            </span>
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
      v-model="leftDrawerOpen"
      :content-class="$q.theme === 'mat' ? 'bg-grey-2' : null"
    >
      <q-list
        no-border
        link
        inset-delimiter
      >
        <q-list-header>Configurations</q-list-header>
        <q-item>
          <q-item-main>
            <q-input float-label="Token" v-model="token" />
          </q-item-main>
        </q-item>
        <q-item>
          <q-item-main>
            <q-input float-label="Owner" v-model="owner" />
          </q-item-main>
        </q-item>
        <q-item>
          <q-item-main>
            <q-input float-label="Repository" v-model="repo" />
          </q-item-main>
        </q-item>
        <q-item>
          <q-item-main>
            <q-btn label="Clear" class="full-width" @click="clear" />
          </q-item-main>
        </q-item>
      </q-list>
    </q-layout-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { openURL } from 'quasar';
import { mapActions, mapState } from 'vuex';
import { mapGetterSetter } from '../utils';

export default {
  name: 'DefaultLayout',
  // @ts-ignore
  data() {
    return {
      // @ts-ignore
      leftDrawerOpen: this.$q.platform.is.desktop,
    };
  },
  computed: {
    ...mapGetterSetter('config', ['token', 'repo', 'owner']),
    title() {
      // @ts-ignore
      const titleFromRoute: string = this.$route.meta.title;
      return titleFromRoute;
    },
    paths() {
      // @ts-ignore
      const { owner, repo }: { owner: string, repo: string } = this.$route.params;
      if (repo) {
        return ['Approve', owner, repo];
      }
      return [];
    },
  },
  methods: {
    openURL,
    ...mapActions('config', [
      'clear',
    ]),
  },
};
</script>

<style>
</style>
