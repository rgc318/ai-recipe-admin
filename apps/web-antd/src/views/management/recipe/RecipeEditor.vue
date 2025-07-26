<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Tabs, TabPane, Spin, Button, PageHeader, Space, message } from 'ant-design-vue';

// 导入我们设计的核心组件的占位符或实际组件
import IngredientManager from './components/IngredientManager.vue';
import StepEditor from './components/StepEditor.vue';

// 导入API和类型
import { getRecipeDetails, createRecipe, updateRecipe } from '#/api/management/recipes/recipe';
import type { RecipeRead, RecipeCreateData, RecipeUpdateData } from './types';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const saving = ref(false);
const activeTab = ref('basic');

// 使用 a-z 命名，避免与 vue 的 props 冲突
const recipeId = route.params.id as string;
const isCreateMode = recipeId === 'create';

// 整个表单的响应式数据对象
const formState = reactive<Partial<RecipeRead>>({});

// --- 数据加载 ---
onMounted(async () => {
  if (!isCreateMode) {
    try {
      const data = await getRecipeDetails(recipeId);
      Object.assign(formState, data);
    } catch (error: any) {
      message.error(`加载菜谱数据失败: ${error.message}`);
      router.push({ name: 'RecipeList' }); // 加载失败则返回列表页
    }
  }
  loading.value = false;
});

// --- 事件处理 ---
const handleSave = async () => {
  saving.value = true;
  try {
    // 1. 组合所有页签的数据
    const payload: RecipeUpdateData | RecipeCreateData = {
      title: formState.title,
      description: formState.description,
      // ... 从各个子组件获取它们的状态
    };

    if (isCreateMode) {
      await createRecipe(payload as RecipeCreateData);
      message.success('菜谱创建成功');
      router.push({ name: 'RecipeList' });
    } else {
      await updateRecipe(recipeId, payload as RecipeUpdateData);
      message.success('菜谱更新成功');
    }
  } catch(error: any) {
    message.error(`保存失败: ${error.message}`);
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  router.back();
};
</script>

<template>
  <div class="p-4">
    <PageHeader
      :ghost="false"
      :title="isCreateMode ? '新建菜谱' : '编辑菜谱'"
      @back="handleCancel"
    >
      <template #extra>
        <Space>
          <Button @click="handleCancel">取消</Button>
          <Button type="primary" :loading="saving" @click="handleSave">保存</Button>
        </Space>
      </template>
    </PageHeader>

    <Spin :spinning="loading">
      <Card :bordered="false" class="mt-4">
        <Tabs v-model:activeKey="activeTab">
          <TabPane key="basic" tab="基本信息">
            <div class="p-4">
              <p>这里是基本信息表单区域。</p>
              <p>标题: {{ formState.title }}</p>
            </div>
          </TabPane>

          <TabPane key="ingredients" tab="食材与厨具">
            <div class="p-4">
              <p>这里是动态配料管理区域。</p>
            </div>
          </TabPane>

          <TabPane key="instructions" tab="烹饪步骤">
            <div class="p-4">
              <p>这里是块编辑器风格的步骤编辑区域。</p>
            </div>
          </TabPane>

          <TabPane key="advanced" tab="高级设置">
            <div class="p-4">
              <p>这里是高级设置区域。</p>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </Spin>
  </div>
</template>
