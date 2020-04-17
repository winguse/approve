import { ActionContext } from 'vuex'
import { StoreRoot } from '../../index.d'
import { PR } from '../index.d'

export default async function cancelNewComment (
  context: ActionContext<PR, StoreRoot>
) {
  context.commit('cancelNewComment')
  await context.dispatch('computeComments')
}
