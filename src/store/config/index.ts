import { MutationTree } from 'vuex';

import * as actions from './actions';
import * as getters from './getters';
import * as mutations from './mutations';
import state, { Config } from './state';

export * from './state';

function updateMutationName(key: string) {
  return `update${key[0].toUpperCase()}${key.slice(1)}`;
}

const m: MutationTree<Config> = mutations;

Object.keys(state).forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    // @ts-ignore
    state[key] = value;
  }
  const name = updateMutationName(key);
  m[name] = (config: Config, v: any) => {
    localStorage.setItem(key, v);
    // @ts-ignore
    config[key] = v;
  };
});

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
