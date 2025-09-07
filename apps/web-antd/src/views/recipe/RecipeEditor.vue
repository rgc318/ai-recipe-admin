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
import type { FileRecordRead } from '#/views/management/files/types';

const route = useRoute();
const router = useRouter();
const referenceStore = useRecipeReferenceStore();

const loading = ref(true);
const saving = ref(false);
const activeTab = ref('basic');

const recipeId = route.params.id as string;
const isCreateMode = !recipeId || recipeId === 'create';

// --- 一个完整的、类型安全的、与 API 请求体结构一致的 formState ---
const formState = reactive<RecipeCreateData>({
  title: '',
  description: '',
  prep_time: '',
  cook_time: '',
  servings: '',
  difficulty: '',
  equipment: '',
  author_notes: '',
  cover_image_id: null,
  gallery_image_ids: [],
  category_ids: [],
  tags: [],
  ingredients: [],
  steps: [],
  cover_image: null as FileRecordRead | null,
  gallery_images: [] as FileRecordRead[],
  // gallery_images_to_add: [] as string[],
  // gallery_images_to_delete: [] as string[],
});

// --- 数据加载与映射 ---
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
      formState.difficulty = data.difficulty || '';
      formState.equipment = data.equipment || '';
      formState.author_notes = data.author_notes || '';
      formState.category_ids = data.categories.map((cat) => cat.id);

      formState.tags = data.tags.map((tag) => ({ value: tag.id, label: tag.name }));

      formState.ingredients = data.ingredients.map((ing) => ({
        ingredient: {
          value: ing.ingredient.id,
          label: ing.ingredient.name,
        },
        group: ing.group || null,
        unit_id: ing.unit?.id || null,
        quantity: ing.quantity,
        note: ing.note || null,
      }));

      // 映射封面图和图库
      formState.cover_image_id = data.cover_image?.id || null;
      formState.cover_image = data.cover_image || null;
      formState.gallery_image_ids = data.gallery_images.map((img) => img.id);
      formState.gallery_images = data.gallery_images;

      // 映射步骤，并传递完整的图片对象数组给子组件
      formState.steps = data.steps.map((step) => ({
        instruction: step.instruction,
        duration: step.duration || null,
        image_ids: step.images.map((img) => img.id),
        images: step.images, // 传递完整的图片对象数组
      }));
    } catch (error: any) {
      message.error(`加载菜谱数据失败: ${error.message}`);
      router.back();
    }
  }
  loading.value = false;
});

// --- 简化的保存逻辑 ---
const handleSave = async () => {
  saving.value = true;
  try {
    // 1. 使用深拷贝创建一个干净的 payload，避免直接修改响应式的 formState
    const payload = JSON.parse(JSON.stringify(formState));

    // 2. 在发送给后端前，“解包” ingredient 对象
    if (payload.ingredients) {
      payload.ingredients = payload.ingredients.map((ing: any) => {
        if (typeof ing.ingredient === 'object' && ing.ingredient?.value) {
          return { ...ing, ingredient: ing.ingredient.value };
        }
        return ing;
      });
    }

    // 3. 转换 tags 格式，以适应 Ant Design Select 组件的行为
    if (payload.tags) {
      payload.tags = payload.tags.map((tag: any) => {
        if (typeof tag === 'object' && tag.value) {
          return tag.value;
        }
        return tag;
      });
    }

    if (isCreateMode) {
      const newRecipe = await createRecipe(payload as RecipeCreateData);
      message.success('菜谱创建成功');
      router.replace({ name: 'RecipeEditor', params: { id: newRecipe.id } });
    } else {
      // 4. 【已修复】更新模式：构造包含所有字段和图片差量信息的 payload
      const updatePayload: RecipeUpdateData = {
        ...payload,
        gallery_images_to_add: formState.gallery_images_to_add,
        gallery_images_to_delete: formState.gallery_images_to_delete,
      };

      await updateRecipe(recipeId, updatePayload);
      message.success('菜谱更新成功');

      // 清空差量状态
      formState.gallery_images_to_add = [];
      formState.gallery_images_to_delete = [];
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
              <BasicInfoForm
                v-model="formState"
                :is-create-mode="isCreateMode"
                :recipe-id="recipeId"
              />
            </div>
          </TabPane>

          <TabPane key="ingredients" tab="食材配料">
            <div class="p-4 max-w-4xl mx-auto">
              <IngredientManager v-model="formState.ingredients" />
            </div>
          </TabPane>

          <TabPane key="instructions" tab="烹饪步骤">
            <div class="p-4 max-w-3xl mx-auto">
              <StepEditor
                v-model="formState.steps"
                :is-create-mode="isCreateMode"
                :recipe-id="recipeId"
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </Spin>
  </div>
</template>
