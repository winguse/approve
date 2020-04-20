import { ActionContext } from 'vuex'
import { StoreRoot } from '../index.d'
import { Config } from './index.d'

export function clear (context: ActionContext<Config, StoreRoot>) { // TODO root state typing
  context.commit('clear')
}

let cleanUpTimer: NodeJS.Timer
export function scheduleCleanUp () {
  if (cleanUpTimer) {
    clearInterval(cleanUpTimer)
  }
  cleanUpTimer = setInterval(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      const value = localStorage.getItem(key)
      if (!value) continue
      const timePos = value.indexOf('|')
      if (timePos < 0) continue
      const ts = parseInt(value.slice(0, timePos), 10)
      if (isNaN(ts) || !ts) continue
      const cachedAge = Date.now() - ts
      if (cachedAge > 3600 * 1000) {
        localStorage.removeItem(key)
      }
    }
  }, 60 * 1000)
}
