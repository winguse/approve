
export interface PullRequestInfo {
  key: string;
  repo: string;
  repoLogin: string;
  number: number;
  title: string;
  unread: boolean;
  updatedAt: Date;
}

export interface PullRequests {
  infos: PullRequestInfo[];
}
