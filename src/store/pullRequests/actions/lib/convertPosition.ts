import { ActiveComment, DetailPosition } from '../../index.d';
import convertPositionFromSourceFile from './convertPositionFromSourceFile';
import getFileContentString from './getFileContentString';

export default async function convertPosition(
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
