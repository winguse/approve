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
      <decoration
        :hightLights="change.hightLights"
      />
    </tr>
    </tbody>
  </table>
  </div>
</template>

<style lang="stylus">
.diff-table-wrapper {
  position: relative;
  .add-comment-button {
    z-index: 99999;
    position: absolute;
    font-size: 18px;
    top: 0px;
    left: 0px;
    cursor: pointer;
    &:HOVER {
      opacity: 0.9;
      zoom: 1.5;
      top: -5px;
      left: -5px;
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
  }
}
</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'
import Decoration from '../../components/Decoration.vue'
import { StoreRoot } from '../../store/index.d'
import { ChangeSelection, PR } from '../../store/pullRequests/index.d'

function selectedInsideDiffTable (range: Range): boolean {
  const { commonAncestorContainer } = range
  let ancestor: Node | null = commonAncestorContainer
  for (let i = 0; i < 5; i++) {
    if (!ancestor) {
      return false
    }
    // @ts-ignore
    if (ancestor.localName === 'tbody') {
      if ((ancestor as HTMLElement).dataset.diffRoot) {
        return true
      }
      return false
    }
    ancestor = ancestor.parentElement
  }
  return false
}

function getPreviousLength (node: Node | null): number {
  if (!node) {
    return 0
  }
  if (node.nodeType === Node.TEXT_NODE) {
    // @ts-ignore
    let span: HTMLElement | null = node.parentElement && node.parentElement.previousSibling // span's older brother
    let l = 0
    while (span) {
      // @ts-ignore
      const length = +(span.dataset.length || 0)
      l += length
      // @ts-ignore
      span = span.previousSibling
    }
    return l
  }
  // for other case, it will be 0
  return 0
}

function getChangeIdx (ele: Node | null): number {
  for (let i = 0; i < 5; i++) {
    if (!ele) {
      return -1
    }
    // @ts-ignore
    if (ele.localName === 'tr') {
      const { idx } = (ele as HTMLElement).dataset
      if (idx) {
        return +idx
      }
      return -1
    }
    ele = ele.parentElement
  }
  return -1
}

function calculateSelection (pullRequests: PR): ChangeSelection | undefined {
  const selection = getSelection()
  if (!selection) return
  if (selection.rangeCount === 0) {
    // tslint:disable-next-line:no-console
    // console.log('no: 0');
    return
  }
  const range = selection.getRangeAt(0)
  if (range.collapsed) {
    return
  }
  if (!selectedInsideDiffTable(range)) {
    // tslint:disable-next-line:no-console
    // console.log('no');
    return
  }
  const { startContainer, endContainer } = range
  let { startOffset, endOffset } = range
  startOffset += getPreviousLength(startContainer)
  endOffset += getPreviousLength(endContainer)
  const startIdx = getChangeIdx(startContainer)
  const endIdx = getChangeIdx(endContainer)
  if (startIdx < 0 || endIdx < 0) {
    // unexpected selection
    // tslint:disable-next-line:no-console
    // console.log('unexpected selection');
    return
  }
  const { activeChanges: changes } = pullRequests
  const start = changes[startIdx]
  const end = changes[endIdx]
  let added = false
  let removed = false
  for (let i = startIdx; i <= endIdx; i++) {
    if (changes[i].added) {
      added = true
    }
    if (changes[i].removed) {
      removed = true
    }
  }
  if (added && removed) {
    // tslint:disable-next-line:no-console
    // console.log('corss add / remove');
    return
  }
  const { selectedStartCommit, selectedEndCommit } = pullRequests
  const sha = removed ? selectedStartCommit : selectedEndCommit
  const result: ChangeSelection = {
    sha,
    startLine: (removed ? start.leftLineNumber : start.rightLineNumber) || -1,
    startOffset,
    endLine: (removed ? end.leftLineNumber : end.rightLineNumber) || -1,
    endOffset,
    startIdx,
    endIdx
  }
  // tslint:disable-next-line:no-console
  // console.log(result);
  return result
}

@Component({
  components: { Decoration }
})
export default class CommitSelector extends Vue {
  private get store () {
    const store: Store<StoreRoot> = this.$store
    return store
  }

  private selection: ChangeSelection | undefined;

  public data () {
    return {
      addCommentIdx: -1
    }
  }

  public beforeCreate () {
    // @ts-ignore
    const { owner, repo, pullId }: { owner: string; repo: string; pullId: string } = this.$route.params
    // @ts-ignore
    this.$store.dispatch('pullRequests/load', { owner, repo, pullId })
  }

  public mounted () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    document.addEventListener('selectionchange', this.checkSelection)
  }

  public destroyed () {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    document.removeEventListener('selectionchange', this.checkSelection)
  }

  public openCommentInput () {
    this.store.dispatch('pullRequests/openCommentInput', this.selection)
    const selection = getSelection()
    if (selection) {
      selection.removeAllRanges()
    }
  }

  public checkSelection () {
    const selection = calculateSelection(this.store.state.pullRequests)
    if (!selection) {
      this.selection = undefined
      // @ts-ignore
      this.addCommentIdx = -1
      // TODO remove if the box is opened
      return
    }
    // @ts-ignore
    this.addCommentIdx = selection.endIdx
    this.selection = selection
  }

  get changes () {
    // tslint:disable-next-line:no-console
    // console.log('get changes');
    const { activeChanges } = this.store.state.pullRequests
    return activeChanges
  }
}
</script>
