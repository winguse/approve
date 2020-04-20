
import { GITHUB_API_BASE } from '../../../../utils/shared'

export default async function editComment (
  token: string, owner: string, repo: string, cid: number, body: string
) {
  if (!token) {
    throw new Error('Github toke is needed')
  }
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/comments/${cid}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${token}`
    },
    body: JSON.stringify({
      body
    })
  })
  return await response.json()
}
