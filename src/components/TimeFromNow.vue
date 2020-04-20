<template>
  <span :title="timeStr">{{ text }}</span>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({
  props: {
    ts: Number
  }
})
export default class TimeFromNow extends Vue {
  public data () {
    const { refresh, text, timeStr } = this.calculateTimeDiff()
    setTimeout(() => this.refresh(), refresh * 1000)
    return {
      timeStr,
      text
    }
  }

  public calculateTimeDiff () {
    const { ts } = this.$props
    const timeStr = (new Date(ts)).toLocaleString()
    const seconds = Math.floor((Date.now() - ts) / 1000)
    if (seconds < 60) {
      return {
        timeStr,
        refresh: 5,
        text: `${seconds}s`
      }
    }
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
      return {
        timeStr,
        refresh: 30,
        text: `${minutes}m`
      }
    }
    const hours = Math.floor(seconds / 3600)
    if (hours < 24) {
      return {
        timeStr,
        refresh: 300,
        text: `${hours}h`
      }
    }
    const days = Math.floor(seconds / 3600 / 24)
    if (days < 35) {
      return {
        timeStr,
        refresh: 1800,
        text: `${days}d`
      }
    }
    const months = Math.floor(seconds / 3600 / 24 / 30)
    return {
      timeStr,
      refresh: 1800,
      text: `${months}mo`
    }
  }

  public refresh () {
    const { refresh, text, timeStr } = this.calculateTimeDiff()
    // @ts-ignore
    this.text = text
    // @ts-ignore
    this.timeStr = timeStr
    setTimeout(() => this.refresh(), refresh * 1000)
  }
}
</script>
