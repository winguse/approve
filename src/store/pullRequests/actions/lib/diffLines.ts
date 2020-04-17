import * as diff from 'diff'
import { DiffResult } from '../../index.d'
import getFileContentString from './getFileContentString'

export interface DiffSummaryItem {
  leftLineNumber?: number;
  rightLineNumber?: number;
}

export interface DiffLinesResult {
  left: string;
  right: string;
  diffResult: DiffResult[];
  githubDiffSummary: DiffSummaryItem[];
}

const cached = new Map<string, DiffLinesResult>()

export default async function diffLines (
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  leftSha: string,
  rightSha: string
): Promise<DiffLinesResult> {
  const key = `${owner},${repo},${filePath},${leftSha},${rightSha}`

  const hit = cached.get(key)
  if (hit) {
    return hit
  }

  const [left, right] = await Promise.all([
    getFileContentString(token, owner, repo, filePath, leftSha),
    getFileContentString(token, owner, repo, filePath, rightSha)
  ])

  let leftLineNumberCounter = 0
  let rightLineNumberCounter = 0
  const diffResult = diff.diffLines(left, right)
    .map(({ value, added, removed }) => {
      let startPos = 0
      const result: DiffResult[] = []
      while (startPos < value.length) {
        let endPos = value.indexOf('\n', startPos) + 1
        if (endPos === 0) {
          endPos = value.length
        }
        const d: DiffResult = {
          value: value.slice(startPos, endPos),
          added,
          removed
        }
        if (!added) {
          d.leftLineNumber = ++leftLineNumberCounter
        }
        if (!removed) {
          d.rightLineNumber = ++rightLineNumberCounter
        }
        result.push(d)
        startPos = endPos
      }
      return result
    })
    .reduce((acc, cur) =>
      acc.concat(cur)
    , [])

  // get github diff summary
  const diffSummaryIdxSet = new Set<number>()
  const summaryDt = 3
  for (let i = 0; i < diffResult.length; i++) {
    const d = diffResult[i]
    if (d.added || d.removed) {
      for (let j = i - summaryDt; j <= i + summaryDt; j++) {
        diffSummaryIdxSet.add(j)
      }
    }
  }
  const githubDiffSummary = Array.from(diffSummaryIdxSet)
    .filter(i => i >= 0 && i < diffResult.length)
    .sort((a, b) => a - b)
    .reduce<number[]>((res, i) => {
      if (res.length && i - res[res.length - 1] === 2) {
        res.push(i - 1)
      }
      res.push(i)
      return res
    }, [])
    .map(i => {
      const { leftLineNumber, rightLineNumber } = diffResult[i]
      return { leftLineNumber, rightLineNumber }
    })

  const ret = { diffResult, left, right, githubDiffSummary }
  cached.set(key, ret)

  return ret
}
