<template>
  <q-layout view="hhh Lpr lFf">
    <q-layout-header>
      <q-toolbar
        color="primary"
        :glossy="$q.theme === 'mat'"
        :inverted="$q.theme === 'ios'"
      >
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
    </q-layout-header>

    <router-view name="left" />
    <router-view name="right" />

    <q-page-container>
      <router-view />
    </q-page-container>

    <router-view name="footer" />

  </q-layout>
</template>

<script lang="ts">
import { openURL } from 'quasar';
import Configurations from '../components/Configurations.vue';

export default {
  name: 'DefaultLayout',
  // @ts-ignore
  data() {
    return {
      configOpened: false,
    };
  },
  computed: {
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
  },
  components: {
    Configurations,
  },
};
</script>

<style>
</style>
