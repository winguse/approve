import { Commit, GitObj, MergeBaseCommit, PR, Review } from './index.d';

const emptyGitObj: GitObj = {
  sha: '',
  branch: '',
};

export const emptyState: PR = {
  repo: '',
  owner: '',
  loading: true,
  mergeTo: emptyGitObj,
  mergeFrom: emptyGitObj,
  tree: [],
  comments: [],
  reviews: new Map<string, Review>(),
  commitShaList: [],
  commits: new Map<string, Commit>(),
  activeChanges: [],
  selectedEndCommit: '',
  selectedStartCommit: '',
  baseCommits: new Map<string, MergeBaseCommit>(),
};

export default Object.assign({}, emptyState);
