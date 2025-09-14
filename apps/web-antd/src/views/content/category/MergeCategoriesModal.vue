<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { debounce } from 'lodash-es';
// [修正] 1. 从 category 的 API 文件引入
import { listCategoriesPaginated, mergeCategories } from '#/api/content/category';
import type { CategoryRead, CategoryMergeData } from './types';
import {
  Modal as AModal,
  Form as AForm,
  FormItem as AFormItem,
  Select as ASelect,
  message,
  Tag as ATag,
  RadioGroup as ARadioGroup,
  RadioButton as ARadioButton
} from 'ant-design-vue';

const emit = defineEmits(['success']);

const visible = ref(false);
const loading = ref(false);
const searching = ref(false);

// [修正] 2. 修改变量名
const sourceCategoryOptions = ref<{ label: string; value: string }[]>([]);
const targetCategoryOptions = ref<{ label: string; value: string }[]>([]);

const formState = reactive<{
  source_category_ids: string[]; // [修正]
  target_category_id: string | undefined; // [修正]
}>({
  source_category_ids: [],
  target_category_id: undefined,
});

const contextCategories = ref<CategoryRead[]>([]); // [修正]
const isContextMode = computed(() => contextCategories.value.length > 0);

async function open(selectedCategories?: CategoryRead[]) { // [修正]
  resetFormState();
  if (selectedCategories && selectedCategories.length >= 2) {
    contextCategories.value = selectedCategories;
    targetCategoryOptions.value = selectedCategories.map(c => ({ label: c.name, value: c.id }));
  } else {
    contextCategories.value = [];
  }
  visible.value = true;
}

function resetFormState() {
  formState.source_category_ids = [];
  formState.target_category_id = undefined;
  sourceCategoryOptions.value = [];
  targetCategoryOptions.value = [];
  contextCategories.value = [];
}

function handleCancel() {
  visible.value = false;
}

async function handleOk() {
  let finalPayload: CategoryMergeData;

  if (isContextMode.value) {
    if (!formState.target_category_id) {
      message.warning('请从已选分类中选择一个作为目标'); // [修正] 文本
      return;
    }
    const sourceIds = contextCategories.value
      .map(c => c.id)
      .filter(id => id !== formState.target_category_id);

    // [修正] 3. 确保 Payload 的键名正确
    finalPayload = {
      source_category_ids: sourceIds,
      target_category_id: formState.target_category_id,
    };
  } else {
    if (!formState.target_category_id || formState.source_category_ids.length === 0) {
      message.warning('请搜索并选择源分类和目标分类'); // [修正] 文本
      return;
    }
    if (formState.source_category_ids.includes(formState.target_category_id)) {
      message.error('目标分类不能是被合并的源分类之一'); // [修正] 文本
      return;
    }
    finalPayload = formState as CategoryMergeData; // 此时 formState 的键名已正确
  }

  loading.value = true;
  try {
    await mergeCategories(finalPayload); // [修正] 4. 调用正确的 API
    message.success('合并成功');
    emit('success');
    handleCancel();
  } finally {
    loading.value = false;
  }
}

// [修正] 5. 修改搜索函数
const searchCategories = debounce(async (query: string, optionsRef: typeof sourceCategoryOptions) => {
  if (!query) {
    optionsRef.value = [];
    return;
  }
  searching.value = true;
  try {
    const { items } = await listCategoriesPaginated({ name: query, per_page: 50 });
    optionsRef.value = items.map(item => ({ label: item.name, value: item.id }));
  } finally {
    searching.value = false;
  }
}, 300);

const handleSourceSearch = (query: string) => searchCategories(query, sourceCategoryOptions);
const handleTargetSearch = (query: string) => searchCategories(query, targetCategoryOptions);

defineExpose({ open });
</script>

<template>
  <AModal
    v-model:open="visible"
    title="合并分类"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirm-loading="loading"
  >
    <p class="text-gray-500 mb-4">将一个或多个“源分类”合并入一个“目标分类”。操作后，源分类将被删除，其关联的菜谱将全部转移到目标分类下。</p>
    <AForm v-if="isContextMode" layout="vertical">
      <AFormItem label="请从下列分类中选择一个作为“目标”（将保留）">
        <ARadioGroup v-model:value="formState.target_category_id" button-style="solid">
          <ARadioButton
            v-for="category in contextCategories"
            :key="category.id"
            :value="category.id"
            class="m-1"
          >
            {{ category.name }}
          </ARadioButton>
        </ARadioGroup>
      </AFormItem>
      <AFormItem v-if="formState.target_category_id" label="以下分类将被“合并并删除”">
        <div class="flex flex-wrap gap-1">
          <ATag
            color="warning"
            v-for="category in contextCategories.filter(c => c.id !== formState.target_category_id)"
            :key="category.id"
          >
            {{ category.name }}
          </ATag>
        </div>
      </AFormItem>
    </AForm>
    <AForm v-else layout="vertical">
      <AFormItem label="源分类 (将被合并并删除)">
        <ASelect
          v-model:value="formState.source_category_ids"
          mode="multiple"
          placeholder="输入并搜索要合并的分类"
          :options="sourceCategoryOptions"
          :loading="searching"
          show-search
          :filter-option="false"
          @search="handleSourceSearch"
          allow-clear
        />
      </AFormItem>
      <AFormItem label="目标分类 (将保留)">
        <ASelect
          v-model:value="formState.target_category_id"
          placeholder="输入并搜索一个最终要保留的分类"
          :options="targetCategoryOptions"
          :loading="searching"
          show-search
          :filter-option="false"
          @search="handleTargetSearch"
          allow-clear
        />
      </AFormItem>
    </AForm>
  </AModal>
</template>
