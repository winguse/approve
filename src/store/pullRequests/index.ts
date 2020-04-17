import { Module } from 'vuex'

import { StoreRoot } from '../index.d'
import actions from './actions'
import * as getters from './getters'
import { PR } from './index.d'
import * as mutations from './mutations'
import state from './state'

export * from './state'

const pr: Module<PR, StoreRoot> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}

export default pr
