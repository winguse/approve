import { ActionContext } from 'vuex';
import { StoreRoot } from '../../index.d';
import { CommentState } from '../enums';
import { ExtendedComment, PR } from '../index.d';
import diffLines from './lib/diffLines';
import submitComment from './lib/submitComment';

export default async function submitNewComment(
  context: ActionContext<PR, StoreRoot>,
  { top, right, newCommentMessage }: { top: number, right: number, newCommentMessage: string },
) {
  const {
    newComment, selectedFile, id, owner, repo, mergeFrom: { sha: mergeFromSha },
    mergeTo: { sha: mergeToSha }, selectedEndCommit, selectedStartCommit,
  } = context.state;
  const { rootState: { config: { token } } } = context;
  if (!newComment || !newComment.detailPos) {
    // TODO something wrong
    return;
  }
  const { detailPos, sha } = newComment; // TODO: BUG: Github doesn't allow create comment on master sha
  const line = detailPos.start.line;
  const diffSha = sha === mergeToSha ? selectedEndCommit : sha;
  const { githubDiffSummary } = await diffLines(
    token, owner, repo, selectedFile, mergeToSha, diffSha,
  );
  let githubPosition = 1;
  for (let i = 1; i <= githubDiffSummary.length; i++) {
    const summary = githubDiffSummary[i - 1];
    if (sha === mergeToSha && summary.leftLineNumber === line) {
      githubPosition = i;
      break;
    } else if (sha !== mergeToSha && summary.rightLineNumber === line) {
      githubPosition = i;
      break;
    }
  }

  const fragment: ExtendedComment = {
    state: CommentState.Active,
    line,
    detailPos,
    boxPos: { top, right },
    sha,
  };
  const body = `${newCommentMessage}<!--${JSON.stringify(fragment)}-->`;
  // TODO the new comment is returned here, but without rendered html field
  // i am not using that right now, but doing a hard reload is good way to maintain consistence
  await submitComment(token, owner, repo, id, diffSha, selectedFile, githubPosition, body);
  await context.dispatch('cancelNewComment');
  await context.dispatch('load', {owner, repo, pullId: id}); // TODO loading comment may be enough
  await context.commit('selectFile', selectedFile);
  await context.dispatch('computeComments');
}
