import { CommentState, ReviewState } from './enums';

export interface FileItem {
  name: string;
  fullPath: string;
}

export interface TreeItem extends FileItem {
  icon: string;
}

export interface TreeDirectory extends TreeItem {
  children: Array<TreeDirectory>;
}

export interface GitObj {
  sha: string;
  branch: string;
}

export interface DetailPosition {
  start: {
    line: number;
    position: number;
  };
  end: {
    line: number;
    position: number;
  };
}

export interface UserInfo {
  login: string;
  avatarUrl: string;
}

export interface Comment extends UserInfo {
  state: CommentState;
  message: string;
  html: string;
  at: number;
  id: number;
  replyTo?: number;
  path: string;
  sha: string;
  // github native comment position is base on diff from: compare/<merge_target_branch>...<commit_sha>
  githubPosition: number;
  line: number;
  detailPos?: DetailPosition;
}

export interface Review extends UserInfo {
  state: ReviewState;
  at: number;
}

export interface CommitFile extends FileItem {
  patch: string;
}

export interface ReviewFile extends FileItem {
  /**
   * Diff between current commit to merge target branch.
   *
   * Ground truth is the Github commit compare API.
   *
   * This only for compute the Github comments position. (drop this feature now)
   *
   * NOTE: this seems not clear can be computed ourself, because
   * 1. it's difficult
   * 2. different algo can have different result
   * 3. only the same result can help us on computing the position
   *    compatible to Github's position
   */
  diff?: string;
  additions: number,
  deletions: number,
  sha: string;
}

export interface Commit {
  additions: number;
  deletions: number;
  sha: string;
  mergeBaseSha?: string;
  at: number;
  message: string;
  messageHeadline: string;
  messageBody: string;
  parents: string[];
  /**
   * Affected files of this commit.
   *
   * This is to help us to generate the actual review files.
   *
   * For a merge commit, it will have more than one parents and
   * this list will be very large. Most of them had nothing to do
   * with code review, so we don't keep these data.
   */
  files: Map<string, CommitFile>;
  /**
   * The list of files useful for reviewing.
   *
   * Basically, it's a list of file compare between merge target branch
   * and current commit.
   * Two ways to get this data:
   * 1. expensive and ground truth:
   *    The Github v3 commit compare API.
   *    - list of files' name and path
   *    - either diff or patch
   * 2. cheap, but not always work:
   *    base on commit data.
   *    only works when this commit is a regular commit.
   *    - list of files' name and path
   *    - diff data is hard to be correct
   */
  reviewFiles: Map<string, ReviewFile>;
}

export interface HightLight {
  type: string;
  value: string;
}

export interface ChangedLine {
  idx: number;
  hightLights: HightLight[];
  added: boolean;
  removed: boolean;
  leftLineNumber?: number;
  rightLineNumber?: number;
}

export interface MergeTargetCommit extends GitObj {
  at: number;
  message: string;
  messageHeadline: string;
  messageBody: string;
  reviewFiles: ReviewFile[];
}

export interface PR {
  repo: string;
  owner: string;
  loading: boolean;
  mergeTo: GitObj;
  mergeFrom: GitObj;
  comments: Comment[];
  /**
   * map from login to review
   */
  reviews: Map<string, Review>;
  commits: Map<string, Commit>;
  commitShaList: string[];
  selectedStartCommit: string;
  selectedEndCommit: string;
  /**
   * the active tree
   *
   * compute base on selected two commits
   */
  tree: Array<TreeItem>;
  expendedDir: string[];
  selectedFile: string;
  /**
   * the active changes to display
   *
   * compute base on selected two commits, file
   */
  activeChanges: ChangedLine[];
}

