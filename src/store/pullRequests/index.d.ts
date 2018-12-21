import { CommentState, ReviewState } from './enums';

export interface File {
  name: string;
  addition: number;
  deletion: number;
  fullPath: string;
}

export interface Directory {
  name: string;
  children: Array<Directory | File>;
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
  githubPosition: number; // this is tricky
  line: number;
  detailPos?: DetailPosition;
}

export interface Review extends UserInfo {
  state: ReviewState;
  at: number;
}

export interface Commit {
  additions: number;
  deletions: number;
  sha: string;
  at: number;
  message: string;
  messageHeadline: string;
  messageBody: string;
}

export interface PR {
  repo: string;
  owner: string;
  loading: boolean;
  from: GitObj;
  to: GitObj;
  affected: Array<Directory | File>;
  comments: Comment[];
  reviews: Review[];
  commits: Commit[];
}
