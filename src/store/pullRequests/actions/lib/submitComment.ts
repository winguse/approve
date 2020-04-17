
import { GITHUB_API_BASE } from './shared'

export default async function submitComment (
  token: string, owner: string, repo: string, prId: number, sha: string, path: string, position: number, body: string
) {
  if (!token) {
    throw new Error('Github toke is needed')
  }
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prId}/comments`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`
    },
    body: JSON.stringify({
      body,
      // eslint-disable-next-line @typescript-eslint/camelcase
      commit_id: sha,
      path,
      position
    })
  })
  return await response.json()
}
