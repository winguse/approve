import { ActionContext } from 'vuex';
import { StoreRoot } from '../../index.d';
import { PR } from '../index.d';
import deleteCommentApi from './lib/deleteComment';

export default async function deleteComment(
  context: ActionContext<PR, StoreRoot>,
  cid: number,
) {
  const { owner, repo, selectedFile, id } = context.state;
  const { rootState: { config: { token } } } = context;
  await deleteCommentApi(token, owner, repo, cid);
  await context.dispatch('load', {owner, repo, pullId: id}); // TODO loading comment may be enough
  await context.commit('selectFile', selectedFile);
  await context.dispatch('computeComments');
}
