import { DiffResult } from '../../index.d';

export default function refineDiffResult(
  diffResult: DiffResult[],
  added: boolean | undefined,
  removed: boolean | undefined,
) {
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
