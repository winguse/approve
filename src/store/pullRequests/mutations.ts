import { PR } from './index.d';
import { emptyState } from './state';

export function clear(state: PR) {
  Object.assign(state, emptyState);
}

export function addComment(state: PR) {
  // TODO
}

export function addReview(state: PR) {
  // TODO
}

export function load(state: PR, pr: PR) {
  Object.assign(state, pr);
}
