import { ActionContext } from 'vuex';
import { Config } from './state';

export function clear(context: ActionContext<Config, any>) { // TODO root state typing
  context.commit('clear');
}
