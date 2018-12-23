import log from 'js-logger';
import { PR, ReviewFile, TreeDirectory, TreeItem } from './index.d';
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

export function loadCommitReviewFiles(state: PR, { sha, reviewFiles, mergeBaseSha }:
  { sha: string, reviewFiles: Map<string, ReviewFile>, mergeBaseSha: string }) {
  const { commits } = state;
  const commit = commits.get(sha);
  if (commit) {
    commit.reviewFiles = reviewFiles;
    commit.mergeBaseSha = mergeBaseSha;
    commits.set(sha, commit);
    state.commits = commits;
  } else {
    log.error('cannot find this commit', sha);
  }
}

export function updateSelectedCommits(
  state: PR,
  {selectedStartCommit, selectedEndCommit}: {selectedStartCommit: string, selectedEndCommit: string},
  ) {
  state.selectedStartCommit = selectedStartCommit;
  state.selectedEndCommit = selectedEndCommit;
}

function compactDirectoryNode(node: TreeDirectory) {
  while (
    node.children &&
    node.children.length === 1 &&
    node.children[0].children
  ) {
    const child = node.children[0];
    node.name += '/' + child.name;
    node.fullPath = child.fullPath;
    node.children = child.children;
  }
}

function compactTree(root: TreeDirectory[] | TreeItem[]) {
  for (const node of root) {
    // @ts-ignore
    const dir: TreeDirectory = node;
    if (dir.children) {
      compactDirectoryNode(dir);
      compactTree(dir.children);
    }
  }
  root.sort((a: any, b: any) => {
    if (a.children && b.children) {
      return a.name.localeCompare(b.name);
    }
    if (a.children) {
      return -1;
    }
    if (b.children) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function findAllFolders(root: TreeItem[]) {
  let result: string[] = [];
  for (const node of root) {
    if (node.fullPath.endsWith('/')) {
      // @ts-ignore
      const dir: TreeDirectory = node;
      result = [...result, node.fullPath, ...findAllFolders(dir.children)];
    }
  }
  return result;
}

export function refreshTree(state: PR, files: string[]) {
  const root: TreeItem[] = [];
  for (const file of files) {
    const paths = file.split('/');
    let appendContainer = root;
    for (let i = 0; i < paths.length; i++) {
      const path: string = paths[i];
      const next = appendContainer.find(c => c.name === path);
      if (next) {
        // @ts-ignore
        appendContainer = next.children;
      } else if (i < paths.length - 1) {
        const dir: TreeDirectory = {
          name: path,
          fullPath: paths.slice(0, i + 1).join('/') + '/',
          icon: 'folder',
          children: [],
        };
        appendContainer.push(dir);
        appendContainer = dir.children;
      } else {
        const treeItem: TreeItem = {
          name: path,
          fullPath: paths.join('/'),
          icon: 'insert_drive_file',
        };
        appendContainer.push(treeItem);
      }
    }
  }
  compactTree(root);
  state.expendedDir = findAllFolders(root);
  state.tree = root;
}

export function selectFile(state: PR, selectedFile: string) {
  state.selectedFile = selectedFile;
}

export function setExpendedDir(state: PR, expendedDir: string[]) {
  state.expendedDir = expendedDir;
}
