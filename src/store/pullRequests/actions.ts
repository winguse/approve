
import { ActionContext } from 'vuex'
import { StoreRoot } from '../index.d'
import { PullRequests, PullRequestInfo } from './index.d'
import { GITHUB_API_BASE } from '../../utils/shared'
import executeGraphQlQuery from 'src/utils/executeGraphQlQuery'

export interface URL2Notification {
  [key: string]: {
    threadId: number;
    title: string;
    unread: boolean;
    updatedAt: Date;
  };
}

export interface GHNotification {
  id: number;
  unread: boolean;
  // eslint-disable-next-line camelcase
  updated_at: string;
  subject: {
    type: string;
    title: string;
    url: string;
  };
}

async function listMorePRs (token: string, notifications: PullRequestInfo[]): Promise<{yourPRs: PullRequestInfo[]; notifications: PullRequestInfo[]}> {
  const queries = notifications.map((pr, idx) => `
  prfn_${idx}: repository(name: "${pr.repo}", owner: "${pr.repoLogin}") {
    pullRequest(number: ${pr.number}) {
      author {
        avatarUrl
        login
      }
      state
    }
  }`)
  queries.push(`
  viewer {
    pullRequests(first: 50, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        state
        updatedAt
        title
        number
        author {
          login
          avatarUrl
        }
        repository {
          name
          owner {
            login
          }
        }
      }
    }
  }`)
  const resp = await executeGraphQlQuery(`{${queries.join('')}}`, token, false)
  const yourPRs = resp.data.viewer.pullRequests.nodes.map(({ state, updatedAt, title, number, author: { login: author, avatarUrl: authorAvatar }, repository: { name: repo, owner: { login: repoLogin } } }: any): PullRequestInfo => ({
    state, updatedAt: new Date(updatedAt), title, number, author, authorAvatar, repo, repoLogin, key: [repoLogin, repo, `${number}`].join('/'), unread: false
  }))

  return {
    yourPRs,
    notifications: notifications.map((pr, idx): PullRequestInfo => {
      const { author: { login: author, avatarUrl: authorAvatar }, state } = resp.data[`prfn_${idx}`].pullRequest
      return { author, authorAvatar, state, ...pr }
    })
  }
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
    .reduce((acc: URL2Notification, { id: threadId, updated_at: updatedAtStr, unread, subject: { title, url } }) => {
      if (acc[url]) {
        acc[url].unread = acc[url].unread || unread
      } else {
        acc[url] = { threadId, title, unread, updatedAt: new Date(updatedAtStr) }
      }
      return acc
    }, {})
  const notifications: PullRequestInfo[] = Object.keys(url2notification)
    .map(url => {
      const items = url.split('/').slice(-4)
      const [repoLogin, repo, , numberStr] = items
      return { key: [repoLogin, repo, numberStr].join('/'), repoLogin, repo, number: +numberStr, ...url2notification[url] }
    })
  context.commit('notifications', notifications)
  const { notifications: newNotifications, yourPRs } = await listMorePRs(token, notifications)

  context.commit('notifications', newNotifications)
  context.commit('yourPRs', yourPRs)
}

export async function markRead (context: ActionContext<PullRequests, StoreRoot>, threadId: number): Promise<void> {
  const { rootState: { config: { token } } } = context
  await fetch(GITHUB_API_BASE + '/notifications/threads/' + threadId, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${token}`
    }
  })
}
