<template>
  <table class="diff-table">
    <tbody>
    <tr v-for="change in changes" :key="change.idx" :class="{ added: change.added, removed: change.removed, line: true}">
      <td class="line-number" :data-txt="change.leftLineNumber"></td>
      <td class="line-number" :data-txt="change.rightLineNumber"></td>
      <td class="symbol"></td>
      <td class="code"><span v-for="(hightLight, idx) in change.hightLights" :key="idx" :class="hightLight.type">{{hightLight.value}}</span></td>
    </tr>
    </tbody>
  </table>
</template>

<style lang="stylus">
.diff-table {
  border-spacing: 0;
  width: 100%;
  font-size: 12px;
  line-height: 20px;
  font-family: SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace;
  td {
    padding: 0;
  }
  * {
    box-sizing: border-box;
  }
  .line {
    .symbol {
      text-align: center;
    }
    &.added {
      background: #e6ffed;
      .line-number {
        background-color: #cdffd8;
        border-color: #bef5cb;
      }
      .symbol:before {
        content: '+';
      }
    }
    &.removed {
      background: #ffeef0;
      .line-number {
        background-color: #ffdce0;
        border-color: #fdaeb7;
      }
      .symbol:before {
        content: '-';
      }
    }
    .line-number {
      color: rgba(27,31,35,.3);
      cursor: pointer;
      min-width: 40px;
      padding-left: 5px;
      padding-right: 5px;
      text-align: right;
      user-select: none;
      vertical-align: top;
      white-space: nowrap;
      width: 1%;
    }
    .line-number:before {
      content: attr(data-txt);
    }
    .code {
      white-space: pre;
      .str { color: #080 }  /* string content */
      .kwd { color: #008 }  /* a keyword */
      .com { color: #800 }  /* a comment */
      .typ { color: #606 }  /* a type name */
      .lit { color: #066 }  /* a literal value */
      /* punctuation, lisp open bracket, lisp close bracket */
      .pun, .opn, .clo { color: #660 }
      .tag { color: #008 }  /* a markup tag name */
      .atn { color: #606 }  /* a markup attribute name */
      .atv { color: #080 }  /* a markup attribute value */
      .dec, .var { color: #606 }  /* a declaration; a variable name */
      .fun { color: red }  /* a function name */
    }
  }
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Store } from 'vuex';
import { StoreRoot } from '../../store/index.d';

@Component
export default class CommitSelector extends Vue {
  private get store() {
    const store: Store<StoreRoot> = this.$store;
    return store;
  }

  public beforeCreate() {
    // @ts-ignore
    const { owner, repo, pullId }: { owner: string, repo: string, pullId: string } = this.$route.params;
    // @ts-ignore
    this.$store.dispatch('pullRequests/load', { owner, repo, pullId });
  }

  get changes() {
    return this.store.state.pullRequests.activeChanges;
  }
}
</script>
