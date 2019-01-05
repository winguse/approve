import { ActionContext, ActionTree } from 'vuex';
import { StoreRoot } from '../../index.d';
import { PR } from '../index.d';

export default async function selectFile(
  context: ActionContext<PR, StoreRoot>,
  selectedFile: string,
) {
  await context.commit('selectFile', selectedFile);
  await context.dispatch('computeComments');
}
