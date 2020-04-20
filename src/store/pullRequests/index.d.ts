
export interface PullRequestInfo {
  key: string;
  repo: string;
  repoLogin: string;
  number: number;
  title: string;
  updatedAt: Date;
  threadId?: number; // only valid if from notification
  unread?: boolean; // only valid if from notification
  author?: string;
  authorAvatar?: string;
  state?: string;
}

export interface PullRequests {
  notifications: PullRequestInfo[];
  yourPRs: PullRequestInfo[];
}
