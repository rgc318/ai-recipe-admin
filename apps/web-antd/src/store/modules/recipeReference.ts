// src/store/modules/recipeReference.ts

import { ref } from 'vue';
import { defineStore } from 'pinia';
import { message } from 'ant-design-vue';

// 【修改】导入树形分类类型
import type { CategoryReadWithChildren } from '#/views/content/recipe/types';
// 2. 从我们为“单位管理”模块创建的 types.ts 中导入类型
import type { UnitRead } from '#/views/content/units/types';
import { getAllUnits } from '#/api/content/unit';
// 【修改】导入新的 category tree API
import { getCategoryTree } from '#/api/content/category';

export const useRecipeReferenceStore = defineStore('recipe-reference', () => {
  // --- 状态 (State) ---
  // 用于缓存应用中所有可用的单位和分类
  const allUnits = ref<UnitRead[]>([]);
  // 【修改】存储所有分类，现在是树形结构
  const allCategories = ref<CategoryReadWithChildren[]>([]);
  const hasFetched = ref(false); // 一个标志位，防止重复获取

  // --- 动作 (Actions) ---

  /**
   * @description 一次性获取所有编辑器需要的参考数据
   * 这个 Action 应该在 RecipeEditor.vue 加载时调用
   */
  async function fetchAllReferences() {
    // 如果已经获取过，则不再重复请求，直接使用缓存
    if (hasFetched.value) {
      return;
    }

    try {
      // 使用 Promise.all 并行加载，提升性能
      // 【修改】同时加载单位和“分类树”
      const [unitsResponse, categoriesTree] = await Promise.all([
        getAllUnits(),
        getCategoryTree(),
      ]);

      allUnits.value = unitsResponse || [];
      allCategories.value = categoriesTree || []; // API 直接返回树形数组

      hasFetched.value = true; // 标记为已获取
    } catch (error: any) {
      message.error(`加载编辑器选项失败: ${error.message}`);
      hasFetched.value = false;
    }
  }

  // 完整的 Pinia Store 重置 (无需修改)
  function $reset() {
    allUnits.value = [];
    allCategories.value = [];
    hasFetched.value = false;
  }

  return {
    // State
    allUnits,
    allCategories, // 将所有分类树暴露出去
    hasFetched,
    // Actions
    fetchAllReferences,
    $reset,
  };
});
