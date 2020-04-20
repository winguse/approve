
import { ActionContext } from 'vuex'
import { StoreRoot } from '../../index.d'
import { CommentState } from '../enums'
import { ActiveComment, ChangeSelection, PR } from '../index.d'

export default async function openCommentInput (
  context: ActionContext<PR, StoreRoot>,
  selection: ChangeSelection
) {
  const { state: { selectedFile }, rootState: { info: { login, avatarUrl } } } = context
  const newComment: ActiveComment = {
    id: 0,
    state: CommentState.Active,
    login,
    avatarUrl,
    message: '',
    html: '',
    at: Date.now(),
    replies: [],
    path: selectedFile,
    sha: selection.sha,
    githubPosition: 0,
    line: selection.endLine,
    detailPos: {
      start: {
        line: selection.startLine,
        position: selection.startOffset
      },
      end: {
        line: selection.endLine,
        position: selection.endOffset
      }
    }
  }
  context.commit('openCommentInput', newComment)
  await context.dispatch('computeComments')
}
