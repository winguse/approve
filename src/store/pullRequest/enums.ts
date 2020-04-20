
export enum ReviewState {
  Approved = 'APPROVED',
  Commented = 'COMMENTED',
  ChangesRequested = 'CHANGES_REQUESTED',
}

export enum CommentState {
  Active = 'Active',
  Pending = 'Pending',
  Resolved = 'Resolved',
  WontFix = 'WontFix', // won't fix
  Closed = 'Closed',
}
