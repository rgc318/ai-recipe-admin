import { ref } from 'vue';
import { defineStore } from 'pinia';
import { message } from 'ant-design-vue';
import { getCategoryTree } from '#/api/management/category';
import type { CategoryReadWithChildren } from '#/views/content/category/types';

export const useCategoryStore = defineStore('category', () => {
  // --- State ---
  const categoryTree = ref<CategoryReadWithChildren[]>([]);
  const hasFetched = ref(false);

  // --- Actions ---
  async function fetchCategoryTree(force = false) {
    // 如果不是强制刷新，并且已经获取过，则直接返回
    if (!force && hasFetched.value) {
      return;
    }

    try {
      const res = await getCategoryTree();
      categoryTree.value = res; // 假设拦截器已处理
      hasFetched.value = true;
    } catch (error) {
      message.error('加载分类树失败');
      // 可选：如果加载失败，清空旧数据
      categoryTree.value = [];
      hasFetched.value = false;
    }
  }

  return {
    categoryTree,
    fetchCategoryTree,
  };
});
