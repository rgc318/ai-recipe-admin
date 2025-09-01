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
import * as console from "console";

const route = useRoute();
const router = useRouter();
const referenceStore = useRecipeReferenceStore();

const loading = ref(true);
const saving = ref(false);
const activeTab = ref('basic');

const recipeId = route.params.id as string;
const isCreateMode = !recipeId || recipeId === 'create';

// --- 【核心重构】一个完整的、类型安全的、与 API 请求体结构一致的 formState ---
const formState = reactive<RecipeCreateData>({
  title: '',
  description: '',
  prep_time: '',
  cook_time: '',
  servings: '',
  cover_image_id: null,
  gallery_image_ids: [],
  category_ids: [],
  tags: [],
  ingredients: [],
  steps: [],
});

// --- 【核心重构】数据加载与映射 ---
onMounted(async () => {
  // 触发 Pinia Action，一次性加载所有需要的参考数据 (单位、分类等)
  referenceStore.fetchAllReferences();

  if (!isCreateMode) {
    try {
      const data: RecipeRead = await getRecipeDetails(recipeId);

      // 将获取的 RecipeRead 数据精确映射到新的 formState 结构
      formState.title = data.title;
      formState.description = data.description || '';
      formState.prep_time = data.prep_time || '';
      formState.cook_time = data.cook_time || '';
      formState.servings = data.servings || '';
      formState.cover_image_id = data.cover_image?.id || null;
      formState.gallery_image_ids = data.gallery_images.map((img) => img.id);
      formState.category_ids = data.categories.map((cat) => cat.id);

      // 将 TagRead[] 转换为 Ant Design Select 需要的 { value, label } 格式，以便回显
      formState.tags = data.tags.map((tag) => ({ value: tag.id, label: tag.name }));


      // 将 RecipeIngredientRead[] 映射为 RecipeIngredientInput[]
      formState.ingredients = data.ingredients.map((ing) => ({
        // 【核心修改】将 ingredient 字段映射为一个包含 value 和 label 的对象
        // 这样既传递了ID（作为value），又传递了名称（作为label）
        ingredient: {
          value: ing.ingredient.id,
          label: ing.ingredient.name,
        },
        group: ing.group || null,
        unit_id: ing.unit?.id || null,
        quantity: ing.quantity,
        note: ing.note || null,
      }));

      // 将 RecipeStepRead[] 映射为 RecipeStepInput[]
      formState.steps = data.steps.map((step) => ({
        instruction: step.instruction,
        image_ids: step.images.map((img) => img.id),
      }));
    } catch (error: any) {
      message.error(`加载菜谱数据失败: ${error.message}`);
      router.back();
    }
  }
  loading.value = false;
});

// --- 【核心重构】简化的保存逻辑 ---
const handleSave = async () => {
  saving.value = true;
  try {
    // formState 几乎可以直接作为 payload
    // 使用深拷贝创建一个干净的 payload，避免修改响应式的 formState
    const payload: RecipeCreateData | RecipeUpdateData = JSON.parse(JSON.stringify(formState));

    // 【核心修正】在发送给后端前，“解包” ingredient 对象
    if (payload.ingredients) {
      payload.ingredients = payload.ingredients.map((ing: any) => {
        // 如果 ingredient 是 {value, label} 对象 (已存在的食材)，只取它的 value (ID)
        if (typeof ing.ingredient === 'object' && ing.ingredient?.value) {
          return { ...ing, ingredient: ing.ingredient.value };
        }
        // 如果是字符串 (新创建的食材)，则保持整个对象不变
        return ing;
      });
    }

    // antd 的标签选择器在创建新标签时，值是字符串；选择旧标签时，值是 {value, label} 对象
    // 我们需要将其转换为后端需要的 (string | UUID)[] 格式
    if (payload.tags) {
      payload.tags = payload.tags.map((tag: any) => {
        // 如果是对象格式（已存在的标签），只取其 value (即 ID)
        if (typeof tag === 'object' && tag.value) {
          return tag.value;
        }
        // 如果是字符串格式（新创建的标签），直接使用
        return tag;
      });
    }

    if (isCreateMode) {
      const newRecipe = await createRecipe(payload as RecipeCreateData);
      message.success('菜谱创建成功');
      // 建议：创建成功后，直接跳转到新创建菜谱的编辑页，体验更佳
      router.replace({ name: 'RecipeEditor', params: { id: newRecipe.id } });
    } else {
      await updateRecipe(recipeId, payload as RecipeUpdateData);
      message.success('菜谱更新成功');
      // 可选：通常更新后会返回列表页，或停留在当前页
    }
  } catch (error: any) {
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
          <TabPane key="basic" tab="基础信息与设置">
            <div class="p-4 max-w-3xl mx-auto">
              <BasicInfoForm v-model="formState" />
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
        </Tabs>
      </Card>
    </Spin>
  </div>
</template>
