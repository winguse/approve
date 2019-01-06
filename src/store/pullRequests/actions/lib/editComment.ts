
import { GITHUB_API_BASE } from './shared';

export default async function editComment(
  token: string, owner: string, repo: string, cid: number, body: string,
) {
  if (!token) {
    throw new Error('Github toke is needed');
  }
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/comments/${cid}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
    },
    body: JSON.stringify({
      body,
    }),
  });
  return await response.json();
}
