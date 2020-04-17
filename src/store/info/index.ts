import { Module } from 'vuex'

import { StoreRoot } from '../index.d'
import * as actions from './actions'
import * as getters from './getters'
import { Info } from './index.d'
import * as mutations from './mutations'
import state from './state'

const info: Module<Info, StoreRoot> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}

export default info
