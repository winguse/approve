import { PullRequests, PullRequestInfo } from './index.d'

export function clear (state: PullRequests, param: any) {
  state.infos = []
  localStorage.clear()
}

export function list (state: PullRequests, infos: PullRequestInfo[]) {
  state.infos = infos
}
