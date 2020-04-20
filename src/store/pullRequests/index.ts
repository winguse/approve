import { Module } from 'vuex'

import { StoreRoot } from '../index.d'
import { PullRequests } from './index.d'
import * as actions from './actions'
import * as mutations from './mutations'
import * as getters from './getters'
import state from './state'

export * from './state'

const pullRequests: Module<PullRequests, StoreRoot> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}

export default pullRequests
