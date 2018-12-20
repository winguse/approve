const routes = [
  {
    path: '/',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [
      {
        meta: { title: 'Approve' },
        path: '', component: () => import('pages/Index.vue'),
      }, // list of owners/repos
      {
        path: ':owner/:repo',
        component: () => import('pages/Repo.vue'),
        children: [
          {
            // list pull requests
            meta: { title: 'Pull Requests' },
            path: 'pulls',
            component: () => import('pages/PullRequests.vue'),
          },
          {
            meta: { title: 'Pull Request' },
            path: 'pull/:pull_id',
            component: () => import('pages/PullRequest.vue'),
          },
        ],
      },
    ],
  },
];

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  // @ts-ignore
  routes.push({
    path: '*',
    // @ts-ignore
    component: () => import('pages/Error404.vue'),
  });
}

export default routes;
