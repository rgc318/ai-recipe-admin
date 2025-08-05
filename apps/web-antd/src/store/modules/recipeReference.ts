// src/store/modules/recipeReference.ts

import { ref } from 'vue';
import { defineStore } from 'pinia';
import { message } from 'ant-design-vue';

import type { UnitRead, CategoryRead } from '#/views/recipe/types';
import { getAllUnits } from '#/api/recipes/unit';
// import { getAllCategories } from '#/api/management/category'; // 未来会用到

export const useRecipeReferenceStore = defineStore('recipe-reference', () => {
  // --- 状态 (State) ---
  // 用于缓存应用中所有可用的单位和分类
  const allUnits = ref<UnitRead[]>([]);
  const categoriesForSelector = ref<CategoryRead[]>([]);
  const hasFetched = ref(false); // 一个标志位，防止重复获取

  // --- 动作 (Actions) ---

  /**
   * @description 一次性获取所有编辑器需要的参考数据
   * 这个 Action 可以在 RecipeEditor.vue 加载时调用
   */
  async function fetchAllReferences() {
    // 如果已经获取过，则不再重复请求，直接使用缓存
    if (hasFetched.value) {
      return;
    }

    try {
      // 使用 Promise.all 并行加载，提升性能
      const [unitsResponse /*, categoriesResponse */] = await Promise.all([
        getAllUnits(),
        // getAllCategories(), // 未来启用
      ]);

      allUnits.value = unitsResponse.items || [];
      // categoriesForSelector.value = categoriesResponse.items || []; // 未来启用

      hasFetched.value = true; // 标记为已获取
    } catch (error: any) {
      message.error(`加载编辑器选项失败: ${error.message}`);
    }
  }

  // 完整的 Pinia Store 重置
  function $reset() {
    allUnits.value = [];
    categoriesForSelector.value = [];
    hasFetched.value = false;
  }

  return {
    // State
    allUnits,
    categoriesForSelector,
    hasFetched,
    // Actions
    fetchAllReferences,
    $reset,
  };
});
