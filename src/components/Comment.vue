<template>
<div class="comment-box" :style="{
    top: top + 'px',
    left: left + 'px',
  }"
    @mousedown.prevent.stop="mousedown"
    @mouseup.prevent.stop="mouseup"
    @mouseout.prevent.stop="mouseup"
    @mousemove.prevent.stop="mousemove"
>
  <q-card>
    <q-card-main>
      <q-list>
        <q-item v-if="c.message">
          <q-item-side :avatar="c.avatarUrl" />
          <q-item-main>
            <q-item-tile label>@{{ c.login }} <small>{{ c.at }}</small></q-item-tile>
            <q-item-tile sublabel>{{ c.message }}</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item v-for="r in c.replies" :key="r.id">
          <q-item-side :avatar="r.avatarUrl" />
          <q-item-main>
            <q-item-tile label>@{{ r.login }} <small>{{ r.at }}</small></q-item-tile>
            <q-item-tile sublabel>{{ r.message }}</q-item-tile>
          </q-item-main>
        </q-item>
        <q-item>
          <q-item-side :avatar="c.avatarUrl" />
          <q-item-main>
            <q-input
              v-model="newCommentMessage"
              type="textarea"
              placeholder="Comment"
              hide-underline
              autofocus
            />
          </q-item-main>
        </q-item>
      </q-list>
    </q-card-main>
    <q-card-separator />
    <q-card-actions align="end">
      <q-select
        v-if="c.id > 0"
        v-model="commentState"
        :options="commentStateOptions"
        hide-underline
      />
      <q-btn v-if="c.id === 0" color="primary" label="Submit" @click="submitNewComment"/>
      <q-btn v-if="c.id === 0" label="Cancle" @click="cancelNewComment"/>
    </q-card-actions>
  </q-card>
  <svg :height="svg.h" :width="svg.w" class="commen-line" :style="{
    top: svg.t + 'px',
    left: svg.l + 'px'
  }" pointer-events="none">
    <line :x1="svg.x1" :y1="svg.y1" :x2="svg.x2" :y2="svg.y2" style="stroke:rgba(255,225,0,0.8);stroke-width:2" />
  </svg>
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
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Store } from 'vuex';
import { StoreRoot } from '../store/index.d';
import { CommentState } from '../store/pullRequests/enums';
import { ActiveComment } from '../store/pullRequests/index.d';

@Component({
  props: {
    c: Object,
  },
})
export default class Comment extends Vue {

  private get store() {
    const store: Store<StoreRoot> = this.$store;
    return store;
  }

  private mouseStartPos: { x: number, y: number, top: number, left: number } | undefined ;

  get cmt(): ActiveComment {
    // @ts-ignore
    return this.c;
  }

  public data() {
    return {
      top: 100,
      left: -150,
      newCommentMessage: '',
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
    const { top, left }: { top: number, left: number } = this;
    const w = Math.abs(left);
    const h = Math.abs(top);
    const t = Math.min(0, -top);
    const l = Math.min(0, -left);

    const x1 = t === 0 ? w : 0;
    const x2 = t === 0 ? 0 : w;
    const y1 = l === 0 ? h : 0;
    const y2 = l === 0 ? 0   : h;

    return {w, h, t, l, x1, x2, y1, y2};
  }

  get commentState() {
    return this.cmt.state;
  }

  set commentState(v) {
    // TODO
  }

  public cancelNewComment() {
    this.store.dispatch('pullRequests/cancelNewComment');
  }

  public submitNewComment() {
    // TODO
  }

  public mousedown(e: MouseEvent) {
    this.mouseStartPos = {
      x: e.clientX,
      y: e.clientY,
      // @ts-ignore
      top: this.top, left: this.left,
    };
  }

  public mouseup() {
    this.mouseStartPos = undefined;
  }

  public mousemove(e: MouseEvent) {
    if (!this.mouseStartPos) {
      return;
    }
    const { x, y, top, left } = this.mouseStartPos;
    // @ts-ignore
    this.left = e.clientX - x + left;
    // @ts-ignore
    this.top = e.clientY - y + top;
  }
}
</script>
