import { ActiveComment, DetailPosition } from '../../index.d';
import convertPositionFromSourceFile from './convertPositionFromSourceFile';

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

  const toRight = await convertPositionFromSourceFile(
    token, owner, repo, comment.path, comment.sha, rightSha, detailPos,
  );
  if (toRight) {
    return { detailPos: toRight, useRight: true };
  }

  const toLeft = await convertPositionFromSourceFile(
    token, owner, repo, comment.path, comment.sha, leftSha, detailPos,
  );
  if (toLeft) {
    return { detailPos: toLeft, useRight: false };
  }

  return undefined;
}
