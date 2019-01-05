import { ActionContext } from 'vuex';
import { StoreRoot } from '../../index.d';
import { CommentState } from '../enums';
import { ExtendedComment, PR } from '../index.d';
import submitComment from './lib/submitComment';

export default async function submitNewComment(
  context: ActionContext<PR, StoreRoot>,
  { top, left, newCommentMessage }: { top: number, left: number, newCommentMessage: string },
) {
  const { newComment, selectedFile, id, owner, repo } = context.state;
  const { rootState: { config: { token } } } = context;
  if (!newComment || !newComment.detailPos) {
    // TODO something wrong
    return;
  }
  const { detailPos, sha } = newComment; // TODO: BUG: Github doesn't allow create comment on master sha
  // TODO compute detailPos to githubPosition
  const githubPosition = 1;
  const fragment: ExtendedComment = {
    state: CommentState.Active,
    line: detailPos.start.line,
    detailPos,
    boxPos: { top, left },
  };
  const body = `${newCommentMessage}<!--${JSON.stringify(fragment)}-->`;
  // TODO the new comment is returned here, but without rendered html field
  // i am not using that right now, but doing a hard reload is good way to maintain consistence
  await submitComment(token, owner, repo, id, sha, selectedFile, githubPosition, body);
}
