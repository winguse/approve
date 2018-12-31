<template>
  <div class="diff-table-wrapper">
  <table class="diff-table">
    <tbody data-diff-root="true">
    <tr v-for="change in changes" :key="change.idx" :data-idx="change.idx" :class="{ added: change.added, removed: change.removed, line: true}">
      <td class="line-number" :data-txt="change.leftLineNumber"></td>
      <td class="line-number" :data-txt="change.rightLineNumber"></td>
      <td class="symbol"><q-icon
      v-if="addCommentIdx === change.idx"
      class="add-comment-button text-primary"
      name="add_comment"
      @click.stop.native="openCommentInput"
    /></td>
      <td class="code"><span v-for="(hightLight, idx) in change.hightLights" :key="idx" :class="hightLight.type">{{hightLight.value}}</span></td>
    </tr>
    </tbody>
  </table>
  </div>
</template>

<style lang="stylus">
.diff-table-wrapper {
  position: relative;
  .add-comment-button {
    position: absolute;
    font-size: 18px;
    top: 0px;
    left: 0px;
    cursor: pointer;
    &:HOVER {
      opacity: 0.9;
    }
  }
}
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
      user-select: none;
      position: relative;
      width: 20px;
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
import { PR } from '../../store/pullRequests/index.d';

function selectedInsideDiffTable(range: Range): boolean {
  const { commonAncestorContainer } = range;
  let ancestor: Node | null = commonAncestorContainer;
  for (let i = 0; i < 5; i++) {
    if (!ancestor) {
      return false;
    }
    // @ts-ignore
    if (ancestor.localName === 'tbody') {
      if ((ancestor as HTMLElement).dataset.diffRoot) {
        return true;
      }
      return false;
    }
    ancestor = ancestor.parentElement;
  }
  return false;
}

function getPreviousLength(node: Node | null): number {
  if (!node) {
    return 0;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement; // span
    let l = 0;
    while (node) {
      l += (node.textContent || '').length;
      node = node.previousSibling;
    }
    return l;
  }
  // for other case, it will be 0
  return 0;
}

function getChangeIdx(ele: Node | null): number {
  for (let i = 0; i < 5; i++) {
    if (!ele) {
      return -1;
    }
    // @ts-ignore
    if (ele.localName === 'tr') {
      const { idx } = (ele as HTMLElement).dataset;
      if (idx) {
        return +idx;
      }
      return -1;
    }
    ele = ele.parentElement;
  }
  return -1;
}

interface ChangeSelection {
  sha: string;
  startLine: number;
  startOffset: number;
  endLine: number;
  endOffset: number;
  startIdx: number;
  endIdx: number;
}

function calculateSelection(pullRequests: PR): ChangeSelection | undefined {
  const selection = getSelection();
  if (selection.rangeCount === 0) {
    // tslint:disable-next-line:no-console
    // console.log('no: 0');
    return;
  }
  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    return;
  }
  if (!selectedInsideDiffTable(range)) {
    // tslint:disable-next-line:no-console
    // console.log('no');
    return;
  }
  const { startContainer, endContainer } = range;
  let { startOffset, endOffset } = range;
  startOffset += getPreviousLength(startContainer);
  endOffset += getPreviousLength(endContainer);
  const startIdx = getChangeIdx(startContainer);
  const endIdx = getChangeIdx(endContainer);
  if (startIdx < 0 || endIdx < 0) {
    // unexpected selection
    // tslint:disable-next-line:no-console
    // console.log('unexpected selection');
    return;
  }
  const { activeChanges: changes } = pullRequests;
  const start = changes[startIdx];
  const end = changes[endIdx];
  let added = false;
  let removed = false;
  for (let i = startIdx; i <= endIdx; i++) {
    if (changes[i].added) {
      added = true;
    }
    if (changes[i].removed) {
      removed = true;
    }
  }
  if (added && removed) {
    // tslint:disable-next-line:no-console
    // console.log('corss add / remove');
    return;
  }
  const { selectedStartCommit, selectedEndCommit } = pullRequests;
  const sha = removed ? selectedStartCommit : selectedEndCommit;
  const result: ChangeSelection = {
    sha,
    startLine: (removed ? start.leftLineNumber : start.rightLineNumber) || -1,
    startOffset,
    endLine: (removed ? end.leftLineNumber : end.rightLineNumber) || -1,
    endOffset,
    startIdx,
    endIdx,
  };
  // tslint:disable-next-line:no-console
  // console.log(result);
  return result;
}

@Component
export default class CommitSelector extends Vue {
  private get store() {
    const store: Store<StoreRoot> = this.$store;
    return store;
  }

  public data() {
    return {
      addCommentIdx: -1,
    };
  }

  public beforeCreate() {
    // @ts-ignore
    const { owner, repo, pullId }: { owner: string, repo: string, pullId: string } = this.$route.params;
    // @ts-ignore
    this.$store.dispatch('pullRequests/load', { owner, repo, pullId });
  }

  public mounted() {
    document.addEventListener('selectionchange', this.checkSelection);
  }

  public destroyed() {
    document.removeEventListener('selectionchange', this.checkSelection);
  }

  public openCommentInput() {
    //
  }

  public checkSelection(event: Event) {
    const selection = calculateSelection(this.store.state.pullRequests);
    if (!selection) {
      // @ts-ignore
      this.addCommentIdx = -1;
      return;
    }
    // @ts-ignore
    this.addCommentIdx = selection.endIdx;
  }

  get changes() {
    return this.store.state.pullRequests.activeChanges;
  }
}
</script>
