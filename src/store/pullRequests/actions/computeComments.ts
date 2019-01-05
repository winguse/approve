
import { ActionContext } from 'vuex';
import { codePrettify } from '../../../utils';
import { StoreRoot } from '../../index.d';
import { ActiveComment, ChangedLine, HightLight, PR } from '../index.d';
import convertPosition from './lib/convertPosition';
import diffLines from './lib/diffLines';
import getFileContentString from './lib/getFileContentString';
import refineDiffResult from './lib/refineDiffResult';
import runPretty from './lib/runPretty';

export default async function computeComments(context: ActionContext<PR, StoreRoot>) {
  // tslint:disable-next-line:no-console
  // console.log('compute');
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
        const endDt = e - endPos;

        const sliceA = Math.max(0, Math.min(value.length, beginDt));
        const sliceB = Math.max(0, Math.min(value.length, value.length - endDt));

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

        if (result[1].value) {
          lastHighlight = result[1]; // middle
        }

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
