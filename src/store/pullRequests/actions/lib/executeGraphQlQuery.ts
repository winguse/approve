
import { GITHUB_GRAPHQL_API_URL } from './shared';

export default async function executeGraphQlQuery(query: string, token: string, cacheResult: boolean = true) {
  if (!token) {
    throw new Error('Github toke is needed');
  }
  const key = `${GITHUB_GRAPHQL_API_URL}|${query}`;
  if (cacheResult) {
    const cached = localStorage.getItem(key);
    if (cached) {
      const timePos = cached.indexOf('|');
      const cachedAge = Date.now() - parseInt(cached.slice(0, timePos), 10);
      if (cachedAge < 3600 * 1000) {
        return JSON.parse(cached.slice(timePos + 1));
      }
    }
  }
  const response = await fetch(GITHUB_GRAPHQL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${token}`,
    },
    body: JSON.stringify({ query }),
  });
  const body = await response.text();
  if (cacheResult) {
    // TODO clear old cache
    localStorage.setItem(key, `${Date.now()}|${body}`);
  }
  return JSON.parse(body);
}
