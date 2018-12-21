import { ActionContext, ActionTree } from 'vuex';
import { StoreRoot } from '../index.d';
import { CommentState } from './enums';
import { Comment, PR, Review } from './index.d';

export function clear(context: ActionContext<PR, StoreRoot>) { // TODO root state typing
  context.commit('clear');
}

function getPullRequestInfoQuery(owner: string, repo: string, pullId: string) {
  return `
fragment commentsFg on PullRequestReviewCommentConnection {
  nodes {
    databaseId
    path
    body
    bodyHTML
    createdAt
    commit {
      oid
    }
    position
    replyTo {
      databaseId
    }
  }
  pageInfo {
    hasNextPage
    endCursor
  }
}

fragment pageInfoFg on PageInfo {
  hasNextPage
  endCursor
}

query getPullRequestInfo {
  repository(name: "${repo}", owner: "${owner}") {
    pullRequest(number: ${pullId}) {
      baseRef {
        name
        target {
          oid
        }
      }
      headRef {
        name
        target {
          oid
        }
      }
      changedFiles
      body
      bodyHTML
      bodyText
      commits(first: 100) {
        nodes {
          commit {
            oid
            message
            messageHeadline
            messageBody
            committedDate
            additions
            deletions
          }
        }
        pageInfo {
          ... pageInfoFg
        }
      }
      reviews(first: 100) {
        nodes {
          databaseId
          author {
            avatarUrl(size: 64)
            login
          }
          state
          createdAt
          body
          commit {
            oid
          }
          comments(first: 100) {
            ...commentsFg
          }
        }
        pageInfo {
          ... pageInfoFg
        }
      }
    }
  }
}`;

}

const GITHUB_GRAPHQL_API_URL = 'https://api.github.com/graphql';

async function executeGraphQlQuery(query: string, token: string) {
  const key = `${GITHUB_GRAPHQL_API_URL}|${query}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    const timePos = cached.indexOf('|');
    const cachedAge = Date.now() - parseInt(cached.slice(0, timePos), 10);
    if (cachedAge < 3600 * 1000) {
      return JSON.parse(cached.slice(timePos + 1));
    }
  }
  const response = await fetch(GITHUB_GRAPHQL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${token}`,
    },
    body: JSON.stringify({ query }),
  });
  const body = await response.text();
  // TODO clear old cache
  localStorage.setItem(key, `${Date.now()}|${body}`);
  return JSON.parse(body);
}

async function getDiff(token: string, owner: string, repo: string, from: string, to: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${from}...${to}`;
  const cached = localStorage.getItem(url);
  if (cached) { // this cache never expire
    const timePos = cached.indexOf('|');
    return JSON.parse(cached.slice(timePos + 1));
  }
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${token}`,
    },
  });
  const body = await response.text();
  // TODO clear old cache
  localStorage.setItem(url, `${Date.now()}|${body}`);
  return JSON.parse(body);
}

function toTimestamp(dateStr: string) {
  return new Date(dateStr).getTime();
}

const commentMessageReg = /(.*?)(<!--(.+)-->)?$/;

export async function load(
    context: ActionContext<PR, StoreRoot>,
    params: { owner: string, repo: string, pullId: string },
  ) {
  const { rootState: { config: { token } } } = context;
  const { owner, repo, pullId } = params;
  const query = getPullRequestInfoQuery(owner, repo, pullId);
  const {data: {repository: {pullRequest: {
    baseRef, headRef, commits: {nodes: commits}, reviews: {nodes: reviews},
  }}}} = await executeGraphQlQuery(query, token);
  const pr: PR = {
    repo,
    owner,
    loading: false,
    from: {
      sha: baseRef.target.oid,
      branch: baseRef.name,
    },
    to: {
      sha: headRef.target.oid,
      branch: headRef.name,
    },
    affected: [],
    comments: reviews.flatMap(
      ({author: {avatarUrl, login}, comments: {nodes}}: any) => {
        return nodes.map(({
          body: rawMessage, bodyHTML: html, commit: {oid: sha}, createdAt,
          databaseId: id, replyTo, position: githubPosition, path,
        }: any) => {
          const [, message, , json] = rawMessage.match(commentMessageReg);
          const fragment = {
            line: 0,
            state: CommentState.Active,
          };
          if (json) {
            Object.assign(fragment, JSON.parse(json));
          }
          const comment: Comment = {
            avatarUrl, login, message, html, sha, at: toTimestamp(createdAt), id,
            replyTo: replyTo && replyTo.databaseId, githubPosition, path,
            ...fragment,
          };
          return comment;
        });
      },
    ),
    reviews: Object.values(reviews.map(
      ({author: {avatarUrl, login}, state, createdAt}: any) =>
        ({avatarUrl, login, state, at: toTimestamp(createdAt)}),
    ).reduce((acc: {[key: string]: Review}, cur: Review) => {
      const last = acc[cur.login];
      if (!last || last.at < cur.at) {
        acc[cur.login] = cur;
      }
      return acc;
    }, {})),
    commits: commits
      .map(({commit: {additions, deletions, oid: sha, committedDate, messageHeadline, messageBody, message}}: any) =>
        ({additions, deletions, sha, at: toTimestamp(committedDate), messageHeadline, message, messageBody})),
  };
  // tslint:disable-next-line:no-console
  console.log(pr);
  context.commit('load', pr);
}

const actions: ActionTree<PR, StoreRoot> = {
  clear,
  load,
};

export default actions;
