const routes = [
  {
    path: '/',
    component: () => import('layouts/DefaultLayout.vue'),
    children: [
      {
        meta: { title: 'Pull Requests' },
        path: '',
        component: () => import('pages/PullRequests.vue')
      },
      {
        meta: { title: 'Pull Request' },
        path: ':owner/:repo/pull/:pullId',
        components: {
          default: () => import('pages/pull-request/Compare.vue'),
          insideHeader: () => import('pages/pull-request/CommitSelector.vue'),
          left: () => import('pages/pull-request/Tree.vue'),
          right: () => import('pages/pull-request/CommentList.vue'),
          footer: () => import('pages/pull-request/Footer.vue')
        }
      }
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  // @ts-ignore
  routes.push({
    path: '*',
    // @ts-ignore
    component: () => import('pages/Error404.vue')
  })
}

export default routes
