<template>
<div class="comment-box" :style="{
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
  <q-card>
    <q-card-main>
      <q-list>
        <q-item v-if="c.message">
          <q-item-side :avatar="c.avatarUrl" />
          <q-item-main>
            <q-item-tile sublabel>@{{ c.login }} <time-from-now :ts="c.at" /></q-item-tile>
            <q-item-tile v-html="c.html"></q-item-tile>
          </q-item-main>
        </q-item>
        <q-item v-for="r in c.replies" :key="r.id">
          <q-item-side :avatar="r.avatarUrl" />
          <q-item-main>
            <q-item-tile sublabel>@{{ r.login }} <time-from-now :ts="r.at" /></q-item-tile>
            <q-item-tile v-html="r.html"></q-item-tile>
          </q-item-main>
        </q-item>
        <q-item-separator v-if="c.id > 0" />
        <q-item>
          <q-item-side :avatar="avatarUrl" />
          <q-item-main>
            <q-item-tile>
              <q-input
                v-model="newCommentMessage"
                type="textarea"
                :placeholder="c.id === 0 ? 'New Comment' : 'Reply'"
                hide-underline
                @keyup.ctrl.exact.enter.prevent="inputSubmit"
                @focus="inputFocused = true"
                @blur="inputFocused = false"
              />
            </q-item-tile>
          </q-item-main>
        </q-item>
        <q-item v-if="inputFocused || newCommentMessage || c.id === 0">
          <q-item-main style="text-align: right">
            <q-btn color="primary" label="Submit" @click="inputSubmit" size="sm"/>
            <span>&nbsp;</span>
            <q-btn label="Cancle" @click="inputCancle" size="sm"/>
          </q-item-main>
        </q-item>
      </q-list>
    </q-card-main>
    <q-card-separator />
    <q-card-actions v-if="c.id > 0">
      <q-btn flat icon="transit_enterexit" />
      <q-btn flat icon="delete" />
      <q-select
        v-model="commentState"
        :options="commentStateOptions"
        hide-underline
        style="margin-left: auto"
      />
    </q-card-actions>
  </q-card>
</div>
</template>

<style lang="stylus">
.comment-box {
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
</style>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Store } from 'vuex';
import { StoreRoot } from '../store/index.d';
import { CommentState } from '../store/pullRequests/enums';
import { ActiveComment, ChangeableCommentFields, ExtendedComment } from '../store/pullRequests/index.d';
import TimeFromNow from './TimeFromNow.vue';

const DEFAULT_TOP = 50;
const DEFAULT_RIGHT = 30;

@Component({
  components: { TimeFromNow },
})
export default class Comment extends Vue {

  @Prop(Object) public c!: ActiveComment;

  private get store() {
    const store: Store<StoreRoot> = this.$store;
    return store;
  }

  private mouseStartPos: { x: number, y: number, top: number, right: number } | undefined ;

  get changableFields(): ChangeableCommentFields {
    const fragment: ExtendedComment =  {
      state: this.c.state,
      line: this.c.line,
      detailPos: this.c.detailPos,
      boxPos: this.c.boxPos,
    };
    return {
      message: this.c.message,
      cid: this.c.id,
      fragment,
    };
  }

  get avatarUrl() {
    return this.store.state.info.avatarUrl;
  }

  public data() {
    return {
      moving: false,
      inputFocused: false,
      top: DEFAULT_TOP,
      right: DEFAULT_RIGHT,
      newCommentMessage: '',
      commentState: CommentState.Active,
      commentStateOptions: [{
        label: 'Active',
        value: CommentState.Active,
      }, {
        label: 'Pending',
        value: CommentState.Pending,
      }, {
        label: 'Resolved',
        value: CommentState.Resolved,
      }, {
        label: 'Won\'t Fix',
        value: CommentState.WontFix,
      }, {
        label: 'Closed',
        value: CommentState.Closed,
      }],
    };
  }

  get svg() {
    // @ts-ignore
    const { top, right }: { top: number, right: number } = this;
    const w = Math.abs(right);
    const h = Math.abs(top);
    const t = Math.min(0, -top);
    const r = Math.min(0, -right);

    const x1 = t !== 0 ? w : 0;
    const x2 = t !== 0 ? 0 : w;
    const y1 = r === 0 ? h : 0;
    const y2 = r === 0 ? 0 : h;

    return {w, h, t, r, x1, x2, y1, y2};
  }

  @Watch('commentState')
  public onCommentStateChange(val: CommentState, oldVal: CommentState) {
    if (val === this.c.state) {
      return;
    }
    const { changableFields } = this;
    const changes: ChangeableCommentFields = {
      ...changableFields,
      fragment: {
        ...changableFields.fragment,
        state: val,
      },
    };
    this.store.dispatch('pullRequests/updateComment', changes);
  }

  public cancelNewComment() {
    this.store.dispatch('pullRequests/cancelNewComment');
  }

  public submitNewComment() {
    // @ts-ignore
    const { top, right, newCommentMessage }: { top: number, right: number, newCommentMessage: string } = this;
    this.store.dispatch('pullRequests/submitNewComment', { top, right, newCommentMessage });
  }

  public replyComment() {
    if (this.c.id <= 0 ) {
      return;
    }
    // @ts-ignore
    const { newCommentMessage }: { newCommentMessage: string } = this;
    this.store.dispatch('pullRequests/replyComment', { id: this.c.id, newCommentMessage });
  }

  public cancleReply() {
    // @ts-ignore
    this.newCommentMessage = '';
  }

  public inputSubmit() {
    if (this.c.id > 0 ) {
      this.replyComment();
    } else {
      this.submitNewComment();
    }
  }

  public inputCancle() {
    if (this.c.id > 0 ) {
      this.cancleReply();
    } else {
      this.cancelNewComment();
    }
  }

  public mousedown(e: MouseEvent) {
    // @ts-ignore
    let target: any = e.target;
    let insideList = false;

    for (let i = 0; i < 10; i++) {
      if (!target) {
        break;
      }
      if (target.classList.contains('q-list')) {
        insideList = true;
        break;
      }
      target = target.parentElement;
    }

    if (insideList) {
      return;
    }

    // @ts-ignore
    this.moving = true;

    this.mouseStartPos = {
      x: e.clientX,
      y: e.clientY,
      // @ts-ignore
      top: this.top, right: this.right,
    };
  }

  public mouseup() {
    this.mouseStartPos = undefined;
    // @ts-ignore
    this.moving = false;
    if (this.c.id > 0) {
      const boxPos = this.c.boxPos || { right: undefined, top: undefined };
      // @ts-ignore
      const { right, top } = this;
      if (right !== boxPos.right || top !== boxPos.top) {
        const { changableFields } = this;
        const fragment: ExtendedComment = {
            ...changableFields.fragment,
            boxPos: { right, top },
        };
        this.store.dispatch('pullRequests/updateComment', {
          ...changableFields,
          fragment,
        });
      }
    }
  }

  public mousemove(e: MouseEvent) {
    if (!this.mouseStartPos) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const { x, y, top, right } = this.mouseStartPos;
    // @ts-ignore
    this.right = -(e.clientX - x) + right;
    // @ts-ignore
    this.top = e.clientY - y + top;
  }

  public created() {
    if (this.c.boxPos) {
      const { right, top } = this.c.boxPos;
      // @ts-ignore
      this.right = right || DEFAULT_RIGHT;
      // @ts-ignore
      this.top = top || DEFAULT_TOP;
      // @ts-ignore
      this.commentState = this.c.state;
    }
  }
}
</script>
