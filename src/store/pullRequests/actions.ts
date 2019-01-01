import * as diff from 'diff';
import log from 'js-logger';
import { ActionContext, ActionTree } from 'vuex';
import { codePrettify, sleep } from '../../utils';
import { StoreRoot } from '../index.d';
import { CommentState } from './enums';
import { ActiveComment, ChangedLine, ChangeSelection, Comment, Commit, CommitFile,
  DetailPosition, DiffResult, HightLight, PR, Review, ReviewFile } from './index.d';

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_API_URL = GITHUB_API_BASE + '/graphql';

export async function clear(context: ActionContext<PR, StoreRoot>) { // TODO root state typing
  await context.commit('clear');
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

async function executeGraphQlQuery(query: string, token: string) {
  if (!token) {
    throw new Error('Github toke is needed');
  }
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
  if (!token) {
    throw new Error('Github toke is needed');
  }
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/compare/${from}...${to}`;
  const cached = localStorage.getItem(url);
  if (cached) { // this cache never expire
    const timePos = cached.indexOf('|');
    return JSON.parse(cached.slice(timePos + 1));
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
    },
  });
  const body = await response.text();
  // TODO clear old cache
  localStorage.setItem(url, `${Date.now()}|${body}`);
  return JSON.parse(body);
}

export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  fullPath: string,
  ref: string,
  ) {
  if (!token) {
    throw new Error('Github toke is needed');
  }
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${fullPath}?ref=${ref}`;
  const cached = localStorage.getItem(url);
  if (cached) { // this cache never expire
    const timePos = cached.indexOf('|');
    return JSON.parse(cached.slice(timePos + 1));
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
    },
  });
  const body = await response.text();
  // TODO clear old cache
  localStorage.setItem(url, `${Date.now()}|${body}`);
  return JSON.parse(body);
}

export async function getFileContentString(
  token: string,
  owner: string,
  repo: string,
  fullPath: string,
  ref: string,
): Promise<string> {
  const { content } = await getFileContent(token, owner, repo, fullPath, ref);
  return decodeURIComponent(escape(atob(content || '')));
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
    baseRefName, baseRefOid, headRefName, headRefOid, commits: { nodes: commits },
    reviews: { nodes: reviews },
  } },
    viewer: currentUser,
  } } = await executeGraphQlQuery(query, token);
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
    selectedEndCommit: headRefOid,
    selectedStartCommit: baseRefOid,
  };
  await context.commit('load', pr);
  await context.dispatch('loadCommitReviewFiles', headRefOid);
  await context.dispatch('refreshTree');
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
  const { rootState: { config: { token } }, state: { owner, repo, mergeTo: { sha: mergeTargetSha } } } = context;
  // get branch compare
  const { files, merge_base_commit: { sha: mergeBaseSha } }: { files: any[], merge_base_commit: { sha: string } } =
    await getDiff(token, owner, repo, mergeTargetSha, sha);
  const reviewFiles: Map<string, ReviewFile> =
    files.map(({
      patch, filename: fullPath, additions, deletions, sha: fileSha,
    }: any) => {
      const file: ReviewFile = {
        name: fullPath.split('/').pop(),
        fullPath,
        diff: patch,
        additions,
        deletions,
        sha: fileSha,
      };
      return file;
    }).reduce((acc, cur) => {
      acc.set(cur.fullPath, cur);
      return acc;
    }, new Map<string, ReviewFile>());
  await context.commit('loadCommitReviewFiles', { sha, reviewFiles, mergeBaseSha });
}

let waitToken: number;

export async function updateSelectedCommits(
  context: ActionContext<PR, StoreRoot>,
  selectedCommits: {selectedStartCommit: string, selectedEndCommit: string}) {
  await context.commit('updateSelectedCommits', selectedCommits);
  const {selectedStartCommit, selectedEndCommit} = selectedCommits;
  if (selectedStartCommit === selectedEndCommit) {
    return;
  }

  const myWaitToken = waitToken = Math.random();
  await sleep(500);
  if (myWaitToken !== waitToken) { return; }

  if (selectedStartCommit !== context.state.mergeTo.branch) {
    // load review files
    await context.dispatch('loadCommitReviewFiles', selectedStartCommit);
  }
  if (myWaitToken !== waitToken) { return; }
  await context.dispatch('loadCommitReviewFiles', selectedEndCommit);
  if (myWaitToken !== waitToken) { return; }
  await context.dispatch('refreshTree');
}

export async function refreshTree(context: ActionContext<PR, StoreRoot>) {
  const { selectedStartCommit, selectedEndCommit, commits,
    mergeTo: { sha: mergeToSha } } = context.state;
  const endCommit = commits.get(selectedEndCommit);
  if (!endCommit) {
    log.error('cannot find end commit, it\'s not loaded.', selectedEndCommit);
    return;
  }
  const files = new Set<string>(endCommit.reviewFiles.keys());
  if (selectedStartCommit !== mergeToSha) {
    const startCommit = commits.get(selectedStartCommit);
    if (!startCommit) {
      log.error('cannot find start commit, it\'s not loaded.', selectedStartCommit);
      return;
    }
    startCommit.reviewFiles.forEach((value, key) => {
      if (files.has(key)) {
        const endFile = endCommit.reviewFiles.get(key);
        if (endFile && endFile.sha === value.sha) {
          files.delete(key);
        }
      } else {
        files.add(key);
      }
    });
  }
  await context.commit('refreshTree', Array.from(files.keys()));
}

function runPretty(spans: Array<number | string>, spanIdx: number, line: string, pos: number) {
  const hightLights: HightLight[] = [];
  const lineEnding: HightLight = {
    value: '',
    type: 'no-ending',
  };
  if (line.endsWith('\r\n')) {
    lineEnding.type = 'rn-ending';
    lineEnding.value = '\r\n';
    line = line.slice(0, line.length - 2);
  } else if (line.endsWith('\n')) {
    lineEnding.type = 'n-ending';
    lineEnding.value = '\n';
    line = line.slice(0, line.length - 1);
  }
  while (line.length > 0) {
    while (spans[spanIdx + 2] <= pos) { // spans will always ends with safeEndingSpan
      spanIdx += 2;
    }
    // @ts-ignore
    const currentSpanEndPos: number = spans[spanIdx + 2];
    // @ts-ignore
    const currentSpanType: string = spans[spanIdx + 1];
    const cutLength = Math.min(line.length, currentSpanEndPos - pos);
    hightLights.push({
      type: currentSpanType,
      value: line.slice(0, cutLength),
    });
    line = line.slice(cutLength);
    pos += cutLength;
  }
  hightLights.push(lineEnding);
  return { spanIdx, hightLights};
}

function refineDiffResult(diffResult: DiffResult[], added: boolean | undefined, removed: boolean | undefined) {
  const tmp: DiffResult[] = [];
  while (diffResult.length > 0) {
    // @ts-ignore
    const last: DiffResult = diffResult.pop();
    if (last.added === added && last.removed === removed) {
      diffResult.push(last);
      if (last.value.endsWith('\n')) {
        diffResult.push({
          value: '',
          added,
          removed,
          leftLineNumber: last.leftLineNumber && last.leftLineNumber + 1,
          rightLineNumber: last.rightLineNumber && last.rightLineNumber + 1,
        });
      }
      break;
    }
    tmp.unshift(last);
  }
  tmp.forEach(t => diffResult.push(t));
}

function diffLines(left: string, right: string): DiffResult[] {
  let leftLineNumber = 0;
  let rightLineNumber = 0;
  return diff.diffLines(left, right)
  .flatMap(({value, added, removed}) => {
    let startPos = 0;
    const result: DiffResult[] = [];
    while (startPos < value.length) {
      let endPos = value.indexOf('\n', startPos) + 1;
      if (endPos === 0) {
        endPos = value.length;
      }
      const d: DiffResult = {
        value: value.slice(startPos, endPos),
        added,
        removed,
      };
      if (!added) {
        d.leftLineNumber = ++leftLineNumber;
      }
      if (!removed) {
        d.rightLineNumber = ++rightLineNumber;
      }
      result.push(d);
      startPos = endPos;
    }
    return result;
  });
}

export async function selectFile(
  context: ActionContext<PR, StoreRoot>,
  selectedFile: string,
) {
  await context.commit('selectFile', selectedFile);
  await context.dispatch('computeComments');
}

function convertPositionFromSourceFile(source: string, target: string, sourcePos: DetailPosition):
  DetailPosition | undefined {
  let startLine: number | undefined;
  let startPos: number | undefined;
  let endLine: number | undefined;
  let endPos: number | undefined;

  const sr = diffLines(source, target);
  for (const d of sr) {
    if (d.added || d.removed) {
      continue;
    }
    if (!d.leftLineNumber || !d.rightLineNumber) {
      continue;
    }
    if (sourcePos.start.line <= d.leftLineNumber && d.leftLineNumber <= sourcePos.end.line) {
      if (!startLine) {
        startLine = d.rightLineNumber;
      }
      if (!endLine || endLine < d.rightLineNumber) {
        endLine = d.rightLineNumber;
      }
    }
    if (d.leftLineNumber === sourcePos.start.line) {
      startLine = d.rightLineNumber;
      startPos = sourcePos.start.position;
    }
    if (d.leftLineNumber === sourcePos.end.line) {
      endLine = d.rightLineNumber;
      endPos = sourcePos.end.position;
    }
  }
  if (!startLine || !endLine) {
    return undefined;
  }
  return {
    start: {
      line: startLine,
      position: startPos || 0,
    },
    end: {
      line: endLine,
      position: endPos || 0,
    },
  };
}

export async function convertPosition(
    comment: ActiveComment, leftSha: string, rightSha: string, token: string, owner: string, repo: string,
  ): Promise<{ detailPos: DetailPosition, useRight: boolean } | undefined> {
  const detailPos: DetailPosition = comment.detailPos || {
    start: {
      line: comment.line,
      position: 0,
    },
    end: {
      line: comment.line,
      position: Number.MAX_SAFE_INTEGER,
    },
  };
  if (comment.sha === leftSha) {
    return { detailPos, useRight: false };
  }
  if (comment.sha === rightSha) {
    return { detailPos, useRight: true };
  }

  const source = await getFileContentString(token, owner, repo, comment.path, comment.sha);
  const right = await getFileContentString(token, owner, repo, comment.path, rightSha);

  const toRight = convertPositionFromSourceFile(source, right, detailPos);
  if (toRight) {
    return { detailPos: toRight, useRight: true };
  }

  const left = await getFileContentString(token, owner, repo, comment.path, leftSha);
  const toLeft = convertPositionFromSourceFile(source, left, detailPos);
  if (toLeft) {
    return { detailPos: toLeft, useRight: false };
  }

  return undefined;
}

export async function computeComments(context: ActionContext<PR, StoreRoot>) {
  // tslint:disable-next-line:no-console
  console.log('compute');
  const {
    state: { comments, selectedStartCommit, selectedEndCommit, owner, mergeTo: { branch }, commits
    , repo, newComment, selectedFile },
    rootState: { config: { token } },
  } = context;

  let leftRef = selectedStartCommit;
  if (leftRef === branch) {
    const endCommit = commits.get(selectedEndCommit);
    if (!endCommit || !endCommit.mergeBaseSha) {
      throw new Error('merge base sha should be found');
    }
    leftRef = endCommit.mergeBaseSha;
  }
  const rightRef = selectedEndCommit;
  const leftRequest = getFileContentString(token, owner, repo, selectedFile, leftRef);
  const right = await getFileContentString(token, owner, repo, selectedFile, rightRef);
  const left = await leftRequest;
  const extension = selectedFile.split('.').pop();
  const safeEndingSpan = [Number.MAX_SAFE_INTEGER, ''];
  const leftSpans = codePrettify(left, extension).concat(safeEndingSpan);
  const rightSpans = codePrettify(right, extension).concat(safeEndingSpan);

  const diffResult = diffLines(left, right);

  // refine the line ending diff
  if (diffResult.length) {
    const { added, removed } = diffResult[diffResult.length - 1];
    refineDiffResult(diffResult, added, removed);
    refineDiffResult(diffResult, removed, added);
  }

  let leftPos = 0;
  let rightPos = 0;
  let leftSpanIdx = 0;
  let rightSpanIdx = 0;
  const activeChanges =
    diffResult
    .map(({value, added, removed, leftLineNumber, rightLineNumber}, idx) => {
      let pickedHightLights: HightLight[] = [];
      if (!added) {
        const { spanIdx, hightLights } = runPretty(leftSpans, leftSpanIdx, value, leftPos);
        leftPos += value.length;
        leftSpanIdx = spanIdx;
        pickedHightLights = hightLights;
      }
      if (!removed) {
        const { spanIdx, hightLights } = runPretty(rightSpans, rightSpanIdx, value, rightPos);
        rightPos += value.length;
        rightSpanIdx = spanIdx;
        pickedHightLights = hightLights;
      }
      const result: ChangedLine = {
        idx,
        hightLights: [],
        added: !!added,
        removed: !!removed,
      };
      result.hightLights = pickedHightLights;
      result.leftLineNumber = leftLineNumber;
      result.rightLineNumber = rightLineNumber;
      return result;
    });

  const commentOnCurrentFile = comments.filter(c => c.path === selectedFile);
  const commentsMap = commentOnCurrentFile
    .reduce((map, comment) => {
      const activeComment: ActiveComment = {
        ...comment,
        replies: [],
      };
      map.set(comment.id, activeComment);
      return map;
    }, new Map<number, ActiveComment>());
  commentOnCurrentFile
    .sort((a, b) => a.at - b.at)
    .forEach(comment => {
      if (!comment.replyTo) {
        return;
      }
      commentsMap.delete(comment.id);
      const mainComment = commentsMap.get(comment.replyTo);
      if (mainComment) {
        mainComment.replies.push({
          ...comment,
        });
      }
    });
  const activeComments = Array.from(commentsMap.values());
  if (newComment) {
    activeComments.push(newComment);
  }
  let changesWithComments = activeChanges;
  for (const comment of activeComments) {
    const newPos = await convertPosition(
      comment, selectedStartCommit, selectedEndCommit, token, owner, repo,
    );
    if (!newPos) {
      // this comment is missed due to source update
      continue;
    }
    const { detailPos, useRight } = newPos;
    let lastHighlight: HightLight | undefined;
    changesWithComments = changesWithComments.map(change => {
      const currentLine = useRight ? change.rightLineNumber : change.leftLineNumber;
      if (!currentLine) {
        return change;
      }
      if (currentLine < detailPos.start.line || currentLine > detailPos.end.line) {
        return change;
      }
      const startPos = currentLine === detailPos.start.line ? detailPos.start.position : 0;
      const endPos = currentLine === detailPos.end.line ? detailPos.end.position : Number.MAX_SAFE_INTEGER;
      let s = 0;
      const hightLights = change.hightLights.flatMap(hl => {
        const { value, type, commentIds, commentToDisplay } = hl;
        const concatCommentIds = [...(commentIds || []), comment.id];
        const e = s + value.length;
        const result: HightLight[] = [];

        const beginDt = startPos - s;
        const endDt = endPos - e;

        const sliceA = Math.min(0, beginDt);
        const sliceB = value.length - Math.min(0, endDt);

        result.push({
          type,
          value: value.slice(0, sliceA),
          commentIds,
        });
        result.push({
          type,
          value: value.slice(sliceA, sliceB),
          commentIds: concatCommentIds,
        });
        result.push({
          type,
          value: value.slice(sliceB),
          commentIds,
        });

        lastHighlight = result[1]; // middle

        s = e;
        const final =  result.filter(r => r.value);
        if (commentToDisplay) {
          final[final.length].commentToDisplay = commentToDisplay;
        }
        return final;
      });
      return { ...change, hightLights };
    });
    if (lastHighlight) {
      lastHighlight.commentToDisplay = comment;
    }
  }
  context.commit('setActiveChanges', changesWithComments);
}

export async function openCommentInput(
  context: ActionContext<PR, StoreRoot>,
  selection: ChangeSelection,
) {
  const { state: { selectedFile }, rootState: { info: { login, avatarUrl } } } = context;
  const newComment: ActiveComment = {
    id: -1,
    state: CommentState.Active,
    login,
    avatarUrl,
    message: '',
    html: '',
    at: Date.now(),
    replies: [],
    path: selectedFile,
    sha: selection.sha,
    githubPosition: 0,
    line: selection.endLine,
    detailPos: {
      start: {
        line: selection.startLine,
        position: selection.startOffset,
      },
      end: {
        line: selection.endLine,
        position: selection.endOffset,
      },
    },
  };
  await context.commit('openCommentInput', newComment);
  await context.dispatch('computeComments');
}

const actions: ActionTree<PR, StoreRoot> = {
  clear,
  load,
  loadCommitReviewFiles,
  updateSelectedCommits,
  refreshTree,
  selectFile,
  openCommentInput,
  computeComments,
};

export default actions;
