import { ActionContext } from 'vuex';
import { Config } from './state';

export function someAction(context: ActionContext<Config, any>) { // TODO root state typing
  context.commit('someMutation');
}
