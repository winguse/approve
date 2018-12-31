<template>
  <td class="code"><span v-for="(hl, idx) in hightLights" :key="idx" :class="hl.type">{{ hl.value }}</span></td>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Store } from 'vuex';

@Component({
  props: {
    hightLights: Array,
    activeComments: Array,
  },
})
export default class Decoration extends Vue {
}
</script>
