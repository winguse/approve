import { ActionContext } from 'vuex'
import { sleep } from '../../../utils'
import { StoreRoot } from '../../index.d'
import { PR } from '../index.d'

let waitToken: number

export default async function updateSelectedCommits (
  context: ActionContext<PR, StoreRoot>,
  selectedCommits: {selectedStartCommit: string; selectedEndCommit: string}) {
  context.commit('updateSelectedCommits', selectedCommits)
  const { selectedStartCommit, selectedEndCommit } = selectedCommits
  if (selectedStartCommit === selectedEndCommit) {
    return
  }

  const myWaitToken = waitToken = Math.random()
  await sleep(500)
  if (myWaitToken !== waitToken) { return }

  if (selectedStartCommit !== context.state.mergeTo.branch) {
    // load review files
    await context.dispatch('loadCommitReviewFiles', selectedStartCommit)
  }
  if (myWaitToken !== waitToken) { return }
  await context.dispatch('loadCommitReviewFiles', selectedEndCommit)
  if (myWaitToken !== waitToken) { return }
  await context.dispatch('refreshTree')
}
