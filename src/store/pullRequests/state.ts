import { GitObj, PR } from './index.d';

const emptyGitObj: GitObj = {
  sha: '',
  branch: '',
};

export const emptyState: PR = {
  repo: '',
  owner: '',
  loading: true,
  from: emptyGitObj,
  to: emptyGitObj,
  affected: [],
  comments: [],
};

export default Object.assign({}, emptyState);
