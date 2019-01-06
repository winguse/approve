import { DiffResult } from '../../index.d';

export interface DiffSummaryItem {
  leftLineNumber?: number;
  rightLineNumber?: number;
}

export interface DiffSummary {
  leftSha: string;
  rightSha: string;
  items: DiffSummaryItem[];
}

const cachedDiffSummary = new Map<string, DiffSummary>();

export function githubDiffSummary(diffResult: DiffResult[], leftSha: string, rightSha: string) {
  const diffSummaryIdxSet = new Set<number>();
  const summaryDt = 3;
  for (let i = 0; i < diffResult.length;) {
    const d = diffResult[i];
    if (d.added || d.removed) {
      for (let j = i - summaryDt; j <= i + summaryDt; j++) {
        diffSummaryIdxSet.add(j);
      }
      i += summaryDt;
    } else {
      i++;
    }
  }
  const diffSummary: DiffSummary = {
    leftSha,
    rightSha,
    items: Array.from(diffSummaryIdxSet)
    .filter(i => i >= 0 && i < diffResult.length)
    .sort()
    .reduce<number[]>((res, i) => {
      if (res.length && i - res[res.length - 1] === 2) {
        res.push(i - 1);
      }
      res.push(i);
      return res;
    }, [])
    .map(i => {
      const { leftLineNumber, rightLineNumber } = diffResult[i];
      return { leftLineNumber, rightLineNumber };
    }),
  };

  cachedDiffSummary.set(`${leftSha}/${rightSha}`, diffSummary);

  return diffSummary;
}
