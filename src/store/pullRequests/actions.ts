import log from 'js-logger';
import { ActionContext, ActionTree } from 'vuex';
import { StoreRoot } from '../index.d';
import { CommentState } from './enums';
import { Comment, Commit, CommitFile, MergeBaseCommit, MergeBaseFile, PR, Review, ReviewFile } from './index.d';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_API_URL = GITHUB_API_BASE + '/graphql';

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
            parents(first: 10) {
              totalCount
              nodes {
                oid
              }
            }
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
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/compare/${from}...${to}`;
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
  const { data: { repository: { pullRequest: {
    baseRef, headRef, commits: { nodes: commits }, reviews: { nodes: reviews },
  } } } } = await executeGraphQlQuery(query, token);
  const commitList: Commit[] = commits
    .map(({ commit: { additions, deletions, oid: sha, committedDate, messageHeadline,
      messageBody, message, parents: { nodes: parentCommits } } }: any) => {
      const commit: Commit = {
        additions, deletions, sha, at: toTimestamp(committedDate), messageHeadline,
        message, messageBody, files: new Map<string, CommitFile>(), mergeBaseSha: undefined,
        parents: parentCommits.map((c: any) => c.oid), reviewFiles: new Map<string, ReviewFile>(),
      };
      return commit;
    });
  const commitsMap = commitList.reduce((acc: Map<string, Commit>, cur: Commit) => {
    acc.set(cur.sha, cur);
    return acc;
  }, new Map<string, Commit>());
  const mergeBaseSha: string = baseRef.target.oid;
  let lastCommit: Commit = commitList[commitList.length - 1];
  while (true) {
    lastCommit.mergeBaseSha = mergeBaseSha;
    if (lastCommit.parents.length === 1) {
      if (lastCommit.parents[0] === mergeBaseSha) {
        log.debug('done as we reached mergeBaseSha', lastCommit);
        break;
      }
      const previous = commitsMap.get(lastCommit.parents[0]);
      if (previous) {
        lastCommit = previous;
      } else {
        log.warn('expect previous exist', lastCommit);
        break;
      }
    } else {
      log.debug('skip assigning mergeBaseSha because it\'s a merge commit.', lastCommit);
      break;
    }
  }
  const commitShaList = commitList.map((commit: Commit) => commit.sha);
  const pr: PR = {
    repo,
    owner,
    loading: false,
    mergeTo: {
      sha: mergeBaseSha,
      branch: baseRef.name,
    },
    mergeFrom: {
      sha: headRef.target.oid,
      branch: headRef.name,
    },
    tree: [],
    activeChanges: [],
    comments: reviews.flatMap(
      ({ author: { avatarUrl, login }, comments: { nodes } }: any) => {
        return nodes.map(({
          body: rawMessage, bodyHTML: html, commit: { oid: sha }, createdAt,
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
    reviews: reviews.map(
      ({ author: { avatarUrl, login }, state, createdAt }: any) =>
        ({ avatarUrl, login, state, at: toTimestamp(createdAt) }),
    ).reduce((acc: Map<string, Review>, cur: Review) => {
      const last = acc.get(cur.login);
      if (!last || last.at < cur.at) {
        acc.set(cur.login, cur);
      }
      return acc;
    }, new Map<string, Review>()),
    commits: commitsMap,
    commitShaList,
    baseCommits: new Map<string, MergeBaseCommit>(),
    selectedEndCommit: headRef.target.oid,
    selectedStartCommit: baseRef.target.oid,
  };
  context.commit('load', pr);
  context.dispatch('loadCommitReviewFiles', headRef.target.oid);
}

export async function loadCommitReviewFiles(
  context: ActionContext<PR, StoreRoot>,
  sha: string,
) {
  const commit = context.state.commits.get(sha);
  if (!commit) {
    log.warn('commit is not found.', sha);
    return;
  }
  if (commit.reviewFiles.size) {
    log.info('skip because the data we already have.', sha);
    return;
  }
  if (commit.parents.length === 1) {
    const parentSha = commit.parents[0];
    const parentCommit = context.state.commits.get(parentSha);
    if (parentCommit && parentCommit.reviewFiles.size) {
      // TODO in this case, we can:
      // 1. get commit patch
      // 2. fill commit.files
      // 3. generate commit.reviewFiles
      // 4. parentCommit.mergeBaseSha
      // return;
    }
  }
  const { rootState: { config: { token } }, state: { owner, repo, mergeTo: { branch: mergeTargetBranch } } } = context;
  // get branch compare
  const { files, merge_base_commit: { sha: mergeBaseSha } }: { files: any[], merge_base_commit: { sha: string } } =
    await getDiff(token, owner, repo, mergeTargetBranch, sha);
  const reviewFiles: Map<string, ReviewFile> =
    files.map(({ patch: diff, contents_url: contentUrl, filename: fullPath }: any) => {
      const file: ReviewFile = {
        name: fullPath.split('/').pop(),
        fullPath,
        diff,
        contentUrl,
      };
      return file;
    }).reduce((acc, cur) => {
      acc.set(cur.fullPath, cur);
      return acc;
    }, new Map<string, ReviewFile>());
  context.commit('loadCommitReviewFiles', { sha, reviewFiles, mergeBaseSha });
}

let loadReviewFilesOnUpdateTimeoutHandle: number;

export async function updateSelectedCommits(
  context: ActionContext<PR, StoreRoot>,
  selectedCommits: {selectedStartCommit: string, selectedEndCommit: string}) {
  context.commit('updateSelectedCommits', selectedCommits);
  if (loadReviewFilesOnUpdateTimeoutHandle) {
    window.clearTimeout(loadReviewFilesOnUpdateTimeoutHandle);
  }
  loadReviewFilesOnUpdateTimeoutHandle = window.setTimeout(() => {
    const {selectedStartCommit, selectedEndCommit} = selectedCommits;
    if (selectedStartCommit === selectedEndCommit) {
      return;
    }
    if (selectedStartCommit !== context.state.mergeTo.sha) {
      // load review files
      context.dispatch('loadCommitReviewFiles', selectedStartCommit);
    }
    context.dispatch('loadCommitReviewFiles', selectedEndCommit);
  }, 500);
}

const actions: ActionTree<PR, StoreRoot> = {
  clear,
  load,
  loadCommitReviewFiles,
  updateSelectedCommits,
};

export default actions;
