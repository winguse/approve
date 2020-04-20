<template>
<span>
<q-icon v-if="c.minimize" :class="'comment-status-icon comment-state-' + c.state" name="comment"
  @click.stop.native="toggleCommentMinimizeStatus" @mouseover.stop.native="showCommentBox = true" @mouseout.stop.native="showCommentBox = false">
  <!-- <q-tooltip>{{ c.state }}: {{ c.message }}</q-tooltip> -->
</q-icon>
<div v-if="!c.minimize || showCommentBox" class="comment-box" :style="{
    top: top + 'px',
    right: right + 'px',
  }"
    @mousedown="mousedown"
    @mouseup="mouseup"
    @mousemove="mousemove"
>
  <svg :height="svg.h" :width="svg.w" class="commen-line" :style="{
    top: svg.t + 'px',
    right: svg.r + 'px'
  }" pointer-events="none">
    <line :x1="svg.x1" :y1="svg.y1" :x2="svg.x2" :y2="svg.y2" style="stroke:rgba(255,225,0,0.8);stroke-width:2" />
  </svg>
  <div class="moving-bg" v-if="moving" />
  <q-card style="width: 30em">
      <q-list>
        <q-item v-if="c.message">
          <q-item-section avatar>
            <q-avatar rounded>
              <img :src="c.avatarUrl">
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <span>@{{ c.login }}</span>
              <span>&nbsp;</span>
              <time-from-now :ts="c.at" />
              <a :href="githubUrl + c.id" target="_blank" class="goto-github" title="goto Github">
                <q-icon name="fab fa-github"/>
              </a>
            </q-item-label>
            <q-item-label v-html="c.html"></q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-for="r in c.replies" :key="r.id">
          <q-item-section avatar>
            <q-avatar rounded>
              <img :src="r.avatarUrl">
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>
              <span>@{{ r.login }}</span>
              <span>&nbsp;</span>
              <time-from-now :ts="r.at" />
              <a :href="githubUrl + r.id" target="_blank" class="goto-github" title="goto Github">
                <q-icon name="fab fa-github"/>
              </a>
              <q-icon name="delete" class="delete-comment" @click.stop.native="deleteComment" :data-id="r.id" title="delete"/>
            </q-item-label>
            <q-item-label v-html="r.html"></q-item-label>
          </q-item-section>

        </q-item>
        <q-separator v-if="c.id > 0" />
        <q-item>
          <q-item-section>
            <q-input
              v-model="newCommentMessage"
              autogrow
              type="textarea"
              :placeholder="c.id === 0 ? 'New Comment' : 'Reply'"
              hide-underline
              @keyup.ctrl.exact.enter.prevent="inputSubmit"
              @focus="inputFocused = true"
              @blur="inputFocused = false"
            />
          </q-item-section>
        </q-item>
        <q-item v-if="inputFocused || newCommentMessage || c.id === 0">
          <q-card-actions>
            <q-btn color="primary" label="Submit" @click="inputSubmit" size="sm"/>
            <q-btn label="Cancle" @click="inputCancle" size="sm"/>
          </q-card-actions>
        </q-item>
      </q-list>
    <q-separator />
    <q-card-actions v-if="c.id > 0">
      <q-btn flat icon="transit_enterexit" @click.stop="toggleCommentMinimizeStatus"/>
      <q-btn flat icon="delete" @click.stop="deleteComment" :data-id="c.id" />
      <q-select
        v-model="commentState"
        :options="commentStateOptions"
        hide-underline
        style="margin-left: auto"
      />
    </q-card-actions>
  </q-card>
</div>
</span>
</template>

<style lang="stylus">
.comment-box {
  color: black;
  position: absolute;
  background: white;
  z-index: 1000;

  .commen-line {
    position: absolute;
  }

  .moving-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}
.comment-status-icon {
  position: absolute;
  opacity: 0.9;
  top: -85%;
  right: 0;
  font-size: 18px;
  cursor: pointer;
  &:HOVER {
    opacity: 0.7;
  }
}
.comment-state-Active {
  color: red;
}
.comment-state-Pending {
  color: yellow;
}
.comment-state-Resolved {
  color: blue;
}
.comment-state-WontFix {
  color: gray;
}
.comment-state-WontFix {
  color: green;
}
.goto-github {
  text-decoration: none;
  color: #757575;
  &:ACTIVE, &:VISITED {
    color: #757575;
  }
}
.delete-comment {
  cursor: pointer;
}
.comment-info > * {
  margin-right: 0.5em;
}
</style>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Store } from 'vuex'
import { StoreRoot } from '../store/index.d'
import { CommentState } from '../store/pullRequest/enums'
import { ActiveComment, ChangeableCommentFields, ExtendedComment } from '../store/pullRequest/index.d'
import TimeFromNow from './TimeFromNow.vue'

const DEFAULT_TOP = 50
const DEFAULT_RIGHT = -30

@Component({
  components: { TimeFromNow }
})
export default class Comment extends Vue {
  @Prop(Object) public c!: ActiveComment;

  private get store () {
    const store: Store<StoreRoot> = this.$store
    return store
  }

  private mouseStartPos: { x: number; y: number; top: number; right: number } | undefined ;

  get changableFields (): ChangeableCommentFields {
    const fragment: ExtendedComment = {
      state: this.c.state,
      line: this.c.line,
      detailPos: this.c.detailPos,
      boxPos: this.c.boxPos,
      minimize: this.c.minimize
    }
    return {
      message: this.c.message,
      cid: this.c.id,
      fragment
    }
  }

  get githubUrl () {
    const { state: { pullRequest: { owner, repo, id } } } = this.store
    return `https://github.com/${owner}/${repo}/pull/${id}#discussion_r`
  }

  get avatarUrl () {
    return this.store.state.info.avatarUrl
  }

  public data () {
    return {
      moving: false,
      inputFocused: false,
      top: DEFAULT_TOP,
      right: DEFAULT_RIGHT,
      newCommentMessage: '',
      commentState: CommentState.Active,
      commentStateOptions: [{
        label: 'Active',
        value: CommentState.Active
      }, {
        label: 'Pending',
        value: CommentState.Pending
      }, {
        label: 'Resolved',
        value: CommentState.Resolved
      }, {
        label: 'Won\'t Fix',
        value: CommentState.WontFix
      }, {
        label: 'Closed',
        value: CommentState.Closed
      }],
      showCommentBox: false
    }
  }

  get svg () {
    // @ts-ignore
    const { top, right }: { top: number; right: number } = this
    const w = Math.abs(right)
    const h = Math.abs(top)
    const t = Math.min(0, -top)
    const r = Math.min(0, -right)

    const x1 = t !== 0 ? w : 0
    const x2 = t !== 0 ? 0 : w
    const y1 = r === 0 ? h : 0
    const y2 = r === 0 ? 0 : h

    return { w, h, t, r, x1, x2, y1, y2 }
  }

  @Watch('commentState')
  public onCommentStateChange (val: CommentState, oldVal: CommentState) {
    if (val === this.c.state) {
      return
    }
    const { changableFields } = this
    const changes: ChangeableCommentFields = {
      ...changableFields,
      fragment: {
        ...changableFields.fragment,
        state: val
      }
    }
    this.store.dispatch('pullRequest/updateComment', changes)
  }

  public cancelNewComment () {
    this.store.dispatch('pullRequest/cancelNewComment')
  }

  public deleteComment (e: Event) {
    // @ts-ignore
    const commentId = +e.target.dataset.id
    if (!commentId) {
      return
    }
    this.store.dispatch('pullRequest/deleteComment', commentId)
  }

  public toggleCommentMinimizeStatus () {
    const { changableFields } = this
    const minimize = !changableFields.fragment.minimize
    if (minimize === true) {
      // @ts-ignore
      this.showCommentBox = false
    }
    const changes: ChangeableCommentFields = {
      ...changableFields,
      fragment: {
        ...changableFields.fragment,
        minimize
      }
    }
    this.store.dispatch('pullRequest/updateComment', changes)
  }

  public submitNewComment () {
    // @ts-ignore
    const { top, right, newCommentMessage }: { top: number; right: number; newCommentMessage: string } = this
    this.store.dispatch('pullRequest/submitNewComment', { top, right, newCommentMessage })
  }

  public async replyComment () {
    if (this.c.id <= 0) {
      return
    }
    // @ts-ignore
    const { newCommentMessage }: { newCommentMessage: string } = this
    await this.store.dispatch('pullRequest/replyComment', { replyToId: this.c.id, message: newCommentMessage })
    this.cancleReply()
  }

  public cancleReply () {
    // @ts-ignore
    this.newCommentMessage = ''
  }

  public inputSubmit () {
    if (this.c.id > 0) {
      this.replyComment()
    } else {
      this.submitNewComment()
    }
  }

  public inputCancle () {
    if (this.c.id > 0) {
      this.cancleReply()
    } else {
      this.cancelNewComment()
    }
  }

  public mousedown (e: MouseEvent) {
    // @ts-ignore
    let target: any = e.target
    let insideList = false

    for (let i = 0; i < 10; i++) {
      if (!target) {
        break
      }
      if (target.classList.contains('q-list')) {
        insideList = true
        break
      }
      target = target.parentElement
    }

    if (insideList) {
      return
    }

    // @ts-ignore
    this.moving = true

    this.mouseStartPos = {
      x: e.clientX,
      y: e.clientY,
      // @ts-ignore
      top: this.top,
      // @ts-ignore
      right: this.right
    }
  }

  public mouseup () {
    this.mouseStartPos = undefined
    // @ts-ignore
    this.moving = false
    if (this.c.id > 0) {
      const boxPos = this.c.boxPos || { right: undefined, top: undefined }
      // @ts-ignore
      const { right, top } = this
      if (right !== boxPos.right || top !== boxPos.top) {
        const { changableFields } = this
        const fragment: ExtendedComment = {
          ...changableFields.fragment,
          boxPos: { right, top }
        }
        this.store.dispatch('pullRequest/updateComment', {
          ...changableFields,
          fragment
        })
      }
    }
  }

  public mousemove (e: MouseEvent) {
    if (!this.mouseStartPos) {
      return
    }
    e.preventDefault()
    e.stopPropagation()
    const { x, y, top, right } = this.mouseStartPos
    // @ts-ignore
    this.right = -(e.clientX - x) + right
    // @ts-ignore
    this.top = e.clientY - y + top
  }

  public created () {
    if (this.c.boxPos) {
      const { right, top } = this.c.boxPos
      // @ts-ignore
      this.right = right || DEFAULT_RIGHT
      // @ts-ignore
      this.top = top || DEFAULT_TOP
      // @ts-ignore
      this.commentState = this.c.state
    }
  }
}
</script>
