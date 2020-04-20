import Vue from 'vue'
import Vuex from 'vuex'

import config from './config'
import info from './info'
import pullRequest from './pullRequest'
import pullRequests from './pullRequests'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation
 */

export default function (/* { ssrContext } */) {
  const Store = new Vuex.Store({
    strict: process.env.NODE_ENV !== 'production',
    modules: {
      config,
      pullRequest,
      pullRequests,
      info
    }
  })

  return Store
}
