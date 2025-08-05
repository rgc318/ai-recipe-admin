<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Card, Tabs, TabPane, Spin, Button, PageHeader, Space, message } from 'ant-design-vue';

// 导入子组件
import BasicInfoForm from './components/BasicInfoForm.vue';
import IngredientManager from './components/IngredientManager.vue';
import StepEditor from './components/StepEditor.vue';

// 导入 Pinia Store 和 API
import { useRecipeReferenceStore } from '#/store/modules/recipeReference';
import { getRecipeDetails, createRecipe, updateRecipe } from '#/api/recipes/recipe';
import type { RecipeRead, RecipeCreateData, RecipeUpdateData } from './types';

const route = useRoute();
const router = useRouter();
const referenceStore = useRecipeReferenceStore();

const loading = ref(true);
const saving = ref(false);
const activeTab = ref('basic');

const recipeId = route.params.id as string;
const isCreateMode = recipeId === 'create';

// --- 【核心】统一的、分模块的表单状态 ---
const formState = reactive({
  basicInfo: {},
  ingredients: [],
  steps: '',
  advancedInfo: {},
});

// --- 数据加载 ---
onMounted(async () => {
  // 触发 Pinia Action，一次性加载所有需要的参考数据
  referenceStore.fetchAllReferences();

  if (!isCreateMode) {
    try {
      const data = await getRecipeDetails(recipeId);
      // 将获取的数据分发到 formState 的对应模块
      formState.basicInfo = {
        title: data.title,
        description: data.description,
        cover_image_url: data.cover_image_url,
        category: data.category,
        tags: data.tags,
      };
      formState.ingredients = data.ingredients;
      formState.steps = data.steps;
      // ...
    } catch (error: any) {
      message.error(`加载菜谱数据失败: ${error.message}`);
      router.back();
    }
  }
  loading.value = false;
});

// --- 事件处理 ---
const handleSave = async () => {
  saving.value = true;
  try {
    // 【核心】从各个模块组合最终的 payload
    const payload: RecipeUpdateData | RecipeCreateData = {
      ...formState.basicInfo,
      ingredients: formState.ingredients,
      steps: formState.steps,
      ...formState.advancedInfo,
    };

    // 移除从后端获取的只读数据
    delete payload.category;

    if (isCreateMode) {
      const newRecipe = await createRecipe(payload as RecipeCreateData);
      message.success('菜谱创建成功');
      // 跳转到新创建菜谱的编辑页
      router.replace({ name: 'RecipeEditor', params: { id: newRecipe.id } });
    } else {
      await updateRecipe(recipeId, payload as RecipeUpdateData);
      message.success('菜谱更新成功');
      // 可以在这里重新加载数据以显示最新状态
      loading.value = true;
      const updatedData = await getRecipeDetails(recipeId);
      Object.assign(formState.basicInfo, updatedData);
      loading.value = false;
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
    <PageHeader :ghost="false" :title="isCreateMode ? '新建菜谱' : '编辑菜谱'" @back="handleCancel">
      <template #extra>
        <Space>
          <Button @click="handleCancel">取消</Button>
          <Button type="primary" :loading="saving" @click="handleSave">
            {{ isCreateMode ? '发布菜谱' : '保存更改' }}
          </Button>
        </Space>
      </template>
    </PageHeader>

    <Spin :spinning="loading">
      <Card :bordered="false" class="mt-4">
        <Tabs v-model:activeKey="activeTab">
          <TabPane key="basic" tab="基本信息">
            <div class="p-4 max-w-3xl mx-auto">
              <BasicInfoForm v-model="formState.basicInfo" />
            </div>
          </TabPane>

          <TabPane key="ingredients" tab="食材配料">
            <div class="p-4 max-w-4xl mx-auto">
              <IngredientManager v-model="formState.ingredients" />
            </div>
          </TabPane>

          <TabPane key="instructions" tab="烹饪步骤">
            <div class="p-4 max-w-3xl mx-auto">
              <StepEditor v-model="formState.steps" />
            </div>
          </TabPane>

          <TabPane key="advanced" tab="高级设置">
            <div class="p-4 max-w-3xl mx-auto">
              <!-- TODO: 高级设置表单 -->
              <p>这里是高级设置区域，例如准备时间、份量等。</p>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </Spin>
  </div>
</template>
