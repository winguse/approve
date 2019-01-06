
import { ActionTree } from 'vuex';
import { StoreRoot } from '../../index.d';
import { PR } from '../index.d';

import cancelNewComment from './cancelNewComment';
import clear from './clear';
import computeComments from './computeComments';
import load from './load';
import loadCommitReviewFiles from './loadCommitReviewFiles';
import openCommentInput from './openCommentInput';
import refreshTree from './refreshTree';
import reloadAllComments from './reloadAllComments';
import selectFile from './selectFile';
import submitNewComment from './submitNewComment';
import updateComment from './updateComment';
import updateSelectedCommits from './updateSelectedCommits';

const actions: ActionTree<PR, StoreRoot> = {
  clear,
  load,
  loadCommitReviewFiles,
  updateSelectedCommits,
  refreshTree,
  selectFile,
  openCommentInput,
  computeComments,
  cancelNewComment,
  submitNewComment,
  reloadAllComments,
  updateComment,
};

export default actions;
