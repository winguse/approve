import * as diff from 'diff';
import { DiffResult } from '../../index.d';

export default function diffLines(left: string, right: string): DiffResult[] {
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
