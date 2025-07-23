// 文件路径: src/router/modules/profile.ts

import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    // 参照 management.ts 的结构，这个父级路由对象主要用于元数据定义
    // 即使它被隐藏，也保持结构一致性
    name: 'Profile',
    path: '/profile', // 定义基础路径
    // 注意：这里不需要 component 和 redirect，因为实际页面在 children 中定义
    // BasicLayout 是由根路由 '/' 提供的，这里不需要重复指定
    meta: {
      title: $t('page.profile.title'),
      icon: 'ant-design:user-outlined',
      // 关键：确保它不会出现在侧边栏菜单中
      hideInMenu: true,
      // 个人中心通常所有登录用户都可访问，可以不加 permission
      // 如果需要特定角色才能访问，可以在此添加
    },
    children: [
      {
        name: 'ProfilePage',
        // 使用完整的绝对路径，与 management 模块保持一致
        path: '/profile/index',
        component: () => import('#/views/profile/index.vue'),
        meta: {
          title: $t('page.profile.title'),
          // 在面包屑中不显示 "个人中心 > 个人中心"，只显示一次
          hideInBreadcrumb: true,
          // 如果需要，可以为标签页添加一个固定的 key
          // affix: true,
        },
      },
    ],
  },
];

export default routes;
