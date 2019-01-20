
import { GITHUB_API_BASE } from './shared';

export default async function replyComment(
  token: string, owner: string, repo: string, prId: number, replyToId: number, body: string,
) {
  if (!token) {
    throw new Error('Github toke is needed');
  }
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prId}/comments`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
    },
    body: JSON.stringify({
      body,
      in_reply_to: replyToId,
    }),
  });
  return await response.json();
}
