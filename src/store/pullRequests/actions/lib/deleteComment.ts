
import { GITHUB_API_BASE } from './shared'

export default async function deleteComment (
  token: string, owner: string, repo: string, cid: number
) {
  if (!token) {
    throw new Error('Github toke is needed')
  }
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/comments/${cid}`
  await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${token}`
    }
  })
}
