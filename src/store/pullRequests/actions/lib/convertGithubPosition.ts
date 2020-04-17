import { DetailPosition } from '../../index.d'
import diffLines from './diffLines'

export default async function convertGithubPosition (
  filePath: string,
  sha: string,
  githubPosition: number,
  token: string,
  owner: string,
  repo: string,
  mergeToSha: string
): Promise<{ detailPos: DetailPosition; sha: string } | undefined> {
  const { githubDiffSummary } = await diffLines(
    token, owner, repo, filePath, mergeToSha, sha
  )
  const { leftLineNumber, rightLineNumber } = githubDiffSummary[githubPosition - 1]
  const line = rightLineNumber || leftLineNumber
  if (line) {
    return {
      detailPos: {
        start: {
          line,
          position: 0
        },
        end: {
          line,
          position: Number.MAX_SAFE_INTEGER
        }
      },
      sha: rightLineNumber ? sha : mergeToSha
    }
  }

  return undefined
}
