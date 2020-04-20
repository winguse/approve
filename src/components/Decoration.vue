<template>
  <td class="code"><span
    v-for="(hl, idx) in hls"
    :key="idx"
    :class="hl.css"
    :data-length="hl.value.length"
  >{{ hl.value }}<comment
    v-for="c in hl.comments"
    :c="c"
    :key="c.id"
  /></span></td>
</template>

<style lang="stylus">

.code {
  white-space: pre-wrap;

  &>span {
    position: relative;
  }

  .comment {
    background: yellow;
  }

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

</style>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Store } from 'vuex'
import { StoreRoot } from '../store/index.d'
import { ActiveComment, HightLight } from '../store/pullRequest/index.d'
import Comment from './Comment.vue'

interface DisplayHighlight {
  value: string;
  css: { [key: string]: boolean };
  comments: ActiveComment[];
}

@Component({
  props: {
    hightLights: Array
  },
  components: { Comment }
})
export default class Decoration extends Vue {
  private get store () {
    const store: Store<StoreRoot> = this.$store
    return store
  }

  get hls () {
    // @ts-ignore
    const { hightLights }: { hightLights: HightLight[] } = this
    return hightLights.map(({ type, value, commentIds, commentToDisplay }) => {
      const result: DisplayHighlight = {
        value,
        css: {
          [type]: true
        },
        comments: []
      }
      if (commentIds) {
        result.css.comment = true
        for (const commentId of commentIds) {
          result.css[`comment-${commentId}`] = true
        }
      }
      if (commentToDisplay) {
        result.comments = commentToDisplay
      }
      return result
    })
  }
}
</script>
