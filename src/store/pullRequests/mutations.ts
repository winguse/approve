import { PullRequests, PullRequestInfo } from './index.d'

export function clear (state: PullRequests, param: any) {
  state.notifications = []
  localStorage.clear()
}

export function notifications (state: PullRequests, notifications: PullRequestInfo[]) {
  state.notifications = notifications
}

export function yourPRs (state: PullRequests, yourPRs: PullRequestInfo[]) {
  state.yourPRs = yourPRs
}
