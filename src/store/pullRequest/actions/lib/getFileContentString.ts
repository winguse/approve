import getFileContent from './getFileContent'

export default async function getFileContentString (
  token: string,
  owner: string,
  repo: string,
  fullPath: string,
  ref: string
): Promise<string> {
  const { content } = await getFileContent(token, owner, repo, fullPath, ref)
  return decodeURIComponent(escape(atob(content || '')))
}
