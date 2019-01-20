
import log from 'js-logger';
import { ActionContext } from 'vuex';
import { StoreRoot } from '../../index.d';
import { CommentState } from '../enums';
import { Comment, Commit, CommitFile,
  ExtendedComment, PR, Review, ReviewFile } from '../index.d';
import executeGraphQlQuery from './lib/executeGraphQlQuery';

const commentMessageReg = /(.*?)(<!--(.+)-->)?$/;

export const commentFields = `
databaseId
path
body
bodyHTML
createdAt
commit {
  oid
}
originalCommit {
  oid
}
originalPosition
replyTo {
  databaseId
}
`;

function getPullRequestInfoQuery(owner: string, repo: string, pullId: string) {
return `
fragment commentsFg on PullRequestReviewCommentConnection {
nodes {
  ${commentFields}
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
viewer {
  avatarUrl
  login
}
repository(name: "${repo}", owner: "${owner}") {
  pullRequest(number: ${pullId}) {
    baseRefName
    baseRefOid
    headRefName
    headRefOid
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

export function convertReviews(reviews: any): {
  comments: Comment[],
  reviews: Map<string, Review>,
} {
  return {
    comments: reviews.flatMap(
      ({ author: { avatarUrl, login }, comments: { nodes } }: any) => {
        return nodes.map(({
          body: rawMessage, bodyHTML: html, originalCommit: { oid: sha }, createdAt,
          databaseId: id, replyTo, originalPosition: githubPosition, path,
        }: any) => {
          const [, message, , json] = rawMessage.match(commentMessageReg);
          const fragment: ExtendedComment = {
            line: 0,
            state: CommentState.Active,
            detailPos: undefined,
            boxPos: undefined,
            minimize: true,
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
  };
}

function toTimestamp(dateStr: string) {
  return new Date(dateStr).getTime();
}

export default async function load(
  context: ActionContext<PR, StoreRoot>,
  params: { owner: string, repo: string, pullId: string },
) {
  const { rootState: { config: { token } } } = context;
  const { owner, repo, pullId } = params;
  const query = getPullRequestInfoQuery(owner, repo, pullId);
  const { data: { repository: { pullRequest: {
    baseRefName, baseRefOid, headRefName, headRefOid, commits: { nodes: commits },
    reviews: { nodes: reviews },
  } },
    viewer: currentUser,
  } } = await executeGraphQlQuery(query, token, false);
  await context.commit('info/set', currentUser, { root: true });
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
  let lastCommit: Commit = commitList[commitList.length - 1];
  while (true) {
    lastCommit.mergeBaseSha = baseRefOid;
    if (lastCommit.parents.length === 1) {
      if (lastCommit.parents[0] === baseRefOid) {
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
    id: +pullId,
    selectedFile: '',
    expendedDir: [],
    repo,
    owner,
    loading: false,
    mergeTo: {
      sha: baseRefOid,
      branch: baseRefName,
    },
    mergeFrom: {
      sha: headRefOid,
      branch: headRefName,
    },
    tree: [],
    activeChanges: [],
    ...convertReviews(reviews),
    commits: commitsMap,
    commitShaList,
    selectedEndCommit: headRefOid,
    selectedStartCommit: baseRefOid,
  };
  await context.commit('load', pr);
  await context.dispatch('loadCommitReviewFiles', headRefOid);
  await context.dispatch('refreshTree');
}
