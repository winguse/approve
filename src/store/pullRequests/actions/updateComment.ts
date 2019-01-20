import { ActionContext } from 'vuex';
import { StoreRoot } from '../../index.d';
import { ChangeableCommentFields, PR } from '../index.d';
import editComment from './lib/editComment';

export default async function updateComment(
  context: ActionContext<PR, StoreRoot>,
  { message, cid, fragment }: ChangeableCommentFields,
) {
  const { owner, repo } = context.state;
  const { rootState: { config: { token } } } = context;
  const body = `${message}<!--${JSON.stringify(fragment)}-->`;
  await editComment(token, owner, repo, cid, body);
  await context.dispatch('refreshComments');
  await context.dispatch('computeComments');
}
