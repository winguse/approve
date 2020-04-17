
import { ActionContext } from 'vuex'
import { StoreRoot } from '../../index.d'
import { PR } from '../index.d'

export default function clear (context: ActionContext<PR, StoreRoot>) { // TODO root state typing
  context.commit('clear')
}
