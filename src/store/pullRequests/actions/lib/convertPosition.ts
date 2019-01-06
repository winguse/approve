import { ActiveComment, DetailPosition } from '../../index.d';
import convertPositionFromSourceFile from './convertPositionFromSourceFile';

export default async function convertPosition(
  detailPos: DetailPosition,
  sha: string,
  leftSha: string,
  rightSha: string,
  filePath: string,
  token: string,
  owner: string,
  repo: string,
): Promise<{ detailPos: DetailPosition, useRight: boolean } | undefined> {
  if (sha === leftSha) {
    return { detailPos, useRight: false };
  }
  if (sha === rightSha) {
    return { detailPos, useRight: true };
  }

  const toRight = await convertPositionFromSourceFile(
    token, owner, repo, filePath, sha, rightSha, detailPos,
  );
  if (toRight) {
    return { detailPos: toRight, useRight: true };
  }

  const toLeft = await convertPositionFromSourceFile(
    token, owner, repo, filePath, sha, leftSha, detailPos,
  );
  if (toLeft) {
    return { detailPos: toLeft, useRight: false };
  }

  return undefined;
}
