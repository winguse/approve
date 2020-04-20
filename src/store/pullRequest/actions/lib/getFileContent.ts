
import { GITHUB_API_BASE } from '../../../../utils/shared'

export default async function getFileContent (
  token: string,
  owner: string,
  repo: string,
  fullPath: string,
  ref: string
) {
  if (!token) {
    throw new Error('Github toke is needed')
  }
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${fullPath}?ref=${ref}`
  const cached = localStorage.getItem(url)
  if (cached) { // this cache never expire
    const timePos = cached.indexOf('|')
    return JSON.parse(cached.slice(timePos + 1))
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${token}`
    }
  })
  const body = await response.text()
  // TODO clear old cache
  localStorage.setItem(url, `${Date.now()}|${body}`)
  return JSON.parse(body)
}
