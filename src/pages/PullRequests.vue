<template>
  <q-page class="flex flex-center">
    <ul>
      <li>
        <router-link to="/">Home</router-link>
      </li>
      <li>
        <router-link to="/winguse/approve/pull/1">First PR</router-link>
      </li>
    </ul>
  </q-page>
</template>

<style>
</style>

<script lang="ts">
export default {
  name: 'PullRequest',
};
</script>
