
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

export enum CommentState {
  Active,
  Pending,
  Resolved,
  WontFix, // won't fix
  Closed,
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
  createdAt: number;
  id: number;
  replyTo?: number;
  file: string;
  sha: string;
  line: number;
  detailPos?: DetailPosition;
}

export enum ReviewState {
  Approved,
  Commented,
  ChangesRequested,
}

export interface Review extends UserInfo {
  state: ReviewState;
  createdAt: number;
}

export interface PR {
  repo: string;
  owner: string;
  loading: boolean;
  from: GitObj;
  to: GitObj;
  affected: Array<Directory | File>;
  comments: Comment[];
}
