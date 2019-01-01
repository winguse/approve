<template>
  <q-card class="comment" :style="{
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
              float-label="Comment"
            />
          </q-item-main>
        </q-item>
      </q-list>
    </q-card-main>
    <q-card-separator />
    <q-card-actions>
      <q-select
        v-model="commentState"
        :options="commentStateOptions"
      />
    </q-card-actions>
  </q-card>
</template>

<style lang="stylus">
.comment {
  position: absolute;
}
</style>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Store } from 'vuex';
import { CommentState } from '../store/pullRequests/enums';
import { ActiveComment } from '../store/pullRequests/index.d';

@Component({
  props: {
    c: Object,
  },
})
export default class Comment extends Vue {

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
}
</script>
