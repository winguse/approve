import { ActionContext, ActionTree } from 'vuex';
import { StoreRoot } from '../index.d';
import { PR } from './index.d';

export function clear(context: ActionContext<PR, StoreRoot>) { // TODO root state typing
  context.commit('clear');
}

export function load(context: ActionContext<PR, StoreRoot>) {
  //
}

const actions: ActionTree<PR, StoreRoot> = {
  clear,
  load,
};

export default actions;
