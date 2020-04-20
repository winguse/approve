import * as log from 'js-logger'
import { ActionContext } from 'vuex'
import { StoreRoot } from '../../index.d'
import { PR } from '../index.d'

export default function refreshTree (context: ActionContext<PR, StoreRoot>) {
  const {
    selectedStartCommit, selectedEndCommit, commits,
    mergeTo: { sha: mergeToSha },
    selectedFile
  } = context.state
  const endCommit = commits.get(selectedEndCommit)
  if (!endCommit) {
    log.error('cannot find end commit, it\'s not loaded.', selectedEndCommit)
    return
  }
  const files = new Set<string>(endCommit.reviewFiles.keys())
  if (selectedStartCommit !== mergeToSha) {
    const startCommit = commits.get(selectedStartCommit)
    if (!startCommit) {
      log.error('cannot find start commit, it\'s not loaded.', selectedStartCommit)
      return
    }
    startCommit.reviewFiles.forEach((value, key) => {
      if (files.has(key)) {
        const endFile = endCommit.reviewFiles.get(key)
        if (endFile && endFile.sha === value.sha) {
          files.delete(key)
        }
      } else {
        files.add(key)
      }
    })
  }
  context.commit('refreshTree', Array.from(files.keys()))
  if (!selectedFile) {
    context.dispatch('selectFile', files.keys().next().value)
  }
}
