import { Commit, GitObj, PR, Review } from './index.d';

const emptyGitObj: GitObj = {
  sha: '',
  branch: '',
};

export const emptyState: PR = {
  activeComments: [],
  selectedFile: '',
  expendedDir: [],
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
};

export default Object.assign({}, emptyState);
