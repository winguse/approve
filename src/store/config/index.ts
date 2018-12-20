import { Module, MutationTree } from 'vuex';

import { updateMutationName } from '../../utils';
import { StoreRoot } from '../index.d';
import * as actions from './actions';
import * as getters from './getters';
import { Config } from './index.d';
import * as mutations from './mutations';
import state from './state';

const m: MutationTree<Config> = mutations;

Object.keys(state).forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    // @ts-ignore
    state[key] = value;
  }
  const name = updateMutationName(key);
  m[name] = (conf: Config, v: any) => {
    localStorage.setItem(key, v);
    // @ts-ignore
    conf[key] = v;
  };
});

const config: Module<Config, StoreRoot> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};

export default config;
