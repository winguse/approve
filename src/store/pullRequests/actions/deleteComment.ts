import { ActionContext } from 'vuex'
import { StoreRoot } from '../../index.d'
import { PR } from '../index.d'
import deleteCommentApi from './lib/deleteComment'

export default async function deleteComment (
  context: ActionContext<PR, StoreRoot>,
  cid: number
) {
  const { owner, repo } = context.state
  const { rootState: { config: { token } } } = context
  await deleteCommentApi(token, owner, repo, cid)
  await context.dispatch('refreshComments')
  await context.dispatch('computeComments')
}
