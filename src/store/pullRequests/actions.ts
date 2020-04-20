
import { ActionContext } from 'vuex'
import { StoreRoot } from '../index.d'
import { PullRequests, PullRequestInfo } from './index.d'
import { GITHUB_API_BASE } from '../../utils/shared'

export interface URL2Notification {
  [key: string]: {
    title: string;
    unread: boolean;
    updatedAt: Date;
  };
}

export interface GHNotification {
  unread: boolean;
  // eslint-disable-next-line camelcase
  updated_at: string;
  subject: {
    type: string;
    title: string;
    url: string;
  };
}

export async function list (context: ActionContext<PullRequests, StoreRoot>): Promise<void> {
  const { rootState: { config: { token } } } = context
  const res = await fetch(GITHUB_API_BASE + '/notifications?all=true', {
    headers: {
      Authorization: `token ${token}`
    }
  })
  const json: GHNotification[] = await res.json()
  const url2notification = json
    .filter(n => n.subject.type === 'PullRequest')
    .reduce((acc: URL2Notification, { updated_at: updatedAtStr, unread, subject: { title, url } }) => {
      acc[url] = { title, unread, updatedAt: new Date(updatedAtStr) }
      return acc
    }, {})
  const infos: PullRequestInfo[] = Object.keys(url2notification)
    .map(url => {
      const items = url.split('/').slice(-4)
      const [repoLogin, repo, , numberStr] = items
      return { key: items.join('/'), repoLogin, repo, number: +numberStr, ...url2notification[url] }
    })
  context.commit('list', infos)
}
