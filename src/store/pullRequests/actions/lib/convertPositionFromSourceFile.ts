import { DetailPosition } from '../../index.d';
import diffLines from './diffLines';

export default async function convertPositionFromSourceFile(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  leftSha: string,
  rightSha: string,
  sourcePos: DetailPosition,
): Promise<DetailPosition | undefined> {
let startLine: number | undefined;
let startPos: number | undefined;
let endLine: number | undefined;
let endPos: number | undefined;

const { diffResult } = await diffLines(token, owner, repo, filePath, leftSha, rightSha);
for (const d of diffResult) {
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
