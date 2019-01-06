import * as diff from 'diff';
import { DiffResult } from '../../index.d';
import getFileContentString from './getFileContentString';
import { githubDiffSummary } from './githubPosition';

export default async function diffLines(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  leftSha: string,
  rightSha: string,
) {

  const [left, right] = await Promise.all([
    getFileContentString(token, owner, repo, filePath, leftSha),
    getFileContentString(token, owner, repo, filePath, rightSha),
  ]);

  let leftLineNumber = 0;
  let rightLineNumber = 0;
  const diffResult = diff.diffLines(left, right)
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
  githubDiffSummary(diffResult, leftSha, rightSha);
  return { diffResult, left, right };
}
