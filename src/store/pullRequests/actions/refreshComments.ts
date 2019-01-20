import { ActionContext } from 'vuex';
import { StoreRoot } from '../../index.d';
import { PR } from '../index.d';
import executeGraphQlQuery from './lib/executeGraphQlQuery';
import { commentFields, convertReviews } from './load';

function refreshCommentsQuery(owner: string, repo: string, pullId: number) {
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

  query refreshCommentsQuery {
  repository(name: "${repo}", owner: "${owner}") {
    pullRequest(number: ${pullId}) {
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

export default async function refreshComments(context: ActionContext<PR, StoreRoot>) {
  //
  const { rootState: { config: { token } }, state: { id, owner, repo } } = context;
  const query = refreshCommentsQuery(owner, repo, id);
  const { data: { repository: { pullRequest: { reviews: { nodes: reviews } } } } } =
    await executeGraphQlQuery(query, token, false);
  const commandAndReviews = convertReviews(reviews);
  await context.commit('refreshComments', commandAndReviews);
}
