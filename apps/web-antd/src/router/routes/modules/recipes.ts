import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const recipeRoutes: RouteRecordRaw[] = [
  {
    // --- 顶级菜单：“内容管理” ---
    // 作为一个容器，它本身不渲染页面，只用于在侧边栏生成一个可展开的菜单项。
    meta: {
      order: 20, // 排序，让它显示在“概览”之后，“系统管理”之前
      icon: 'ion:book-outline', // 为顶级菜单选择一个图标
      title: $t('page.content.title'), // 国际化标题: "内容管理"
      // authority: ['content:view'], // 使用文档中定义的 'authority'
    },

    name: 'ContentManagement',
    path: '/content', // 顶级菜单的基础路径


    // --- 子菜单与页面路由 ---
    children: [
      {
        name: 'RecipeManagement',
        path: '/content/recipe', // 页面的完整访问路径
        component: () => import('#/views/recipe/index.vue'),
        meta: {
          title: $t('page.content.recipe.title'), // "菜谱管理"
          icon: 'ion:restaurant-outline',
          // authority: ['content:view'], // 使用文档中定义的 'authority'
        },
      },
      {
        name: 'RecipeEditor',
        path: '/content/recipe/editor/:id', // 动态路由，:id 用于区分是新建('create')还是编辑(uuid)
        component: () => import('#/views/recipe/RecipeEditor.vue'),
        meta: {
          // 这个页面不在侧边栏菜单中直接显示
          hideInMenu: true,
          // 当处于此页面时，我们希望侧边栏的“菜谱管理”菜单项保持高亮
          activeMenu: 'RecipeManagement',
          // 页面标题，可以动态设置
          title: $t('page.content.recipe.editorTitle'), // "菜谱编辑"
          // 进入此页面需要的权限，通常与创建和更新权限挂钩
          // authority: ['content:view'], // 使用文档中定义的 'authority'
        },
      },
      // --- 未来扩展点 ---
      // 当你开发分类管理时，可以在这里添加新的子路由
      // {
      //   name: 'CategoryManagement',
      //   path: '/content/category',
      //   component: () => import('#/views/management/category/index.vue'),
      //   meta: {
      //     title: $t('page.content.category.title'), // "分类管理"
      //     icon: 'ion:folder-open-outline',
      //     permission: 'category:list',
      //   },
      // },
    ],
  },
];

export default recipeRoutes;

