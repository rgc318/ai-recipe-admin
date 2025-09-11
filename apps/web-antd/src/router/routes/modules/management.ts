import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    // --- 父级菜单定义 ---
    // 模仿 dashboard.ts，父级路由只作为菜单的容器，不包含 component 和 redirect。
    meta: {
      orderNo: 90, // 控制在侧边栏的显示顺序，数字越大越靠后
      icon: 'ion:settings-outline', // 为“系统管理”选择一个设置图标
      title: $t('page.management.title'), // 推荐使用 $t 进行国际化
      // 关键：为整个模块设置一个总的权限码
      // 只有拥有 'system:view' 权限的用户才能看到“系统管理”这个菜单
      // authority: ['content:view'], // 使用文档中定义的 'authority'
    },
    name: 'Management',
    path: '/management', // 这个路径主要用于菜单分组

    // --- 子菜单定义 ---
    children: [
      {
        name: 'UserManagement',
        // 模仿 dashboard.ts，子路由的 path 定义了完整的访问路径
        path: '/management/user',
        component: () => import('#/views/management/user/index.vue'),
        meta: {
          title: $t('page.management.user'),
          icon: 'ion:people-outline',
          // 为子菜单设置更精细的权限码
          ignoreRouteQuery: true,
        },
      },
      {
        name: 'RoleManagement',
        path: '/management/role',
        component: () => import('#/views/management/role/index.vue'),
        meta: {
          title: $t('page.management.role'),
          icon: 'ion:shield-checkmark-outline',
          // permission: 'role:list',
        },
      },
      {
        name: 'PermissionManagement',
        path: '/management/permission',
        component: () => import('#/views/management/permission/index.vue'),
        meta: {
          title: $t('page.management.permission'),
          icon: 'ion:key-outline',
        },
      },

    ],
  },
];

export default routes;
