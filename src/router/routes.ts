const routes = [
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Index.vue') },
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
