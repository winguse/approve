<template>
  <q-card class="comment-box" :style="{
    top: top + 'px',
    left: left + 'px',
  }">
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
</template>

<style lang="stylus">
.comment-box {
  position: absolute;
  background: white;
  z-index: 1000;
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

  get cmt(): ActiveComment {
    // @ts-ignore
    return this.c;
  }

  public data() {
    return {
      top: 0,
      left: 300,
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
}
</script>
