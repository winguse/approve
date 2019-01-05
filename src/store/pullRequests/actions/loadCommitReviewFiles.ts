
import log from 'js-logger';
import { ActionContext } from 'vuex';
import { StoreRoot } from '../../index.d';
import { PR, ReviewFile  } from '../index.d';
import getDiff from './lib/getDiff';

export default async function loadCommitReviewFiles(
  context: ActionContext<PR, StoreRoot>,
  sha: string,
) {
  const commit = context.state.commits.get(sha);
  if (!commit) {
    log.warn('commit is not found.', sha);
    return;
  }
  if (commit.reviewFiles.size) {
    log.info('skip because the data we already have.', sha);
    return;
  }
  if (commit.parents.length === 1) {
    const parentSha = commit.parents[0];
    const parentCommit = context.state.commits.get(parentSha);
    if (parentCommit && parentCommit.reviewFiles.size) {
      // TODO in this case, we can:
      // 1. get commit patch
      // 2. fill commit.files
      // 3. generate commit.reviewFiles
      // 4. parentCommit.mergeBaseSha
      // return;
    }
  }
  const { rootState: { config: { token } }, state: { owner, repo, mergeTo: { sha: mergeTargetSha } } } = context;
  // get branch compare
  const { files, merge_base_commit: { sha: mergeBaseSha } }: { files: any[], merge_base_commit: { sha: string } } =
    await getDiff(token, owner, repo, mergeTargetSha, sha);
  const reviewFiles: Map<string, ReviewFile> =
    files.map(({
      patch, filename: fullPath, additions, deletions, sha: fileSha,
    }: any) => {
      const file: ReviewFile = {
        name: fullPath.split('/').pop(),
        fullPath,
        diff: patch,
        additions,
        deletions,
        sha: fileSha,
      };
      return file;
    }).reduce((acc, cur) => {
      acc.set(cur.fullPath, cur);
      return acc;
    }, new Map<string, ReviewFile>());
  await context.commit('loadCommitReviewFiles', { sha, reviewFiles, mergeBaseSha });
}
