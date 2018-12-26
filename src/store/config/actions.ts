import { ActionContext } from 'vuex';
import { StoreRoot } from '../index.d';
import { Config } from './index.d';

export function clear(context: ActionContext<Config, StoreRoot>) { // TODO root state typing
  context.commit('clear');
}
