import { ActionContext } from 'vuex'
import { StoreRoot } from '../../index.d'
import { PR } from '../index.d'
import replyCommentApi from './lib/replyComment'

export default async function replyComment (
  context: ActionContext<PR, StoreRoot>,
  { replyToId, message }: { replyToId: number; message: string }
) {
  const { id, owner, repo } = context.state
  const { rootState: { config: { token } } } = context

  await replyCommentApi(token, owner, repo, id, replyToId, message)
  await context.dispatch('refreshComments')
  await context.dispatch('computeComments')
}
