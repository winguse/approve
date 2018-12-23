import { PR, ReviewFile } from './index.d';
import { emptyState } from './state';

export function clear(state: PR) {
  Object.assign(state, emptyState);
}

export function addComment(state: PR) {
  // TODO
}

export function addReview(state: PR) {
  // TODO
}

export function load(state: PR, pr: PR) {
  Object.assign(state, pr);
}

export function loadCommitReviewFiles(state: PR, { sha, reviewFiles, mergeBaseSha }:
  { sha: string, reviewFiles: Map<string, ReviewFile>, mergeBaseSha: string }) {
  const { commits } = state;
  const commit = commits.get(sha);
  if (commit) {
    commit.reviewFiles = reviewFiles;
    commit.mergeBaseSha = mergeBaseSha;
    commits.set(sha, commit);
    state.commits = commits;
  }
}

export function updateSelectedCommits(
  state: PR,
  {selectedStartCommit, selectedEndCommit}: {selectedStartCommit: string, selectedEndCommit: string},
  ) {
  state.selectedStartCommit = selectedStartCommit;
  state.selectedEndCommit = selectedEndCommit;
}
