// 文件位置: src/views/content/ingredient/components/MergeIngredientsModal.vue

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { debounce } from 'lodash-es';
// [核心] 导入 Ingredient 相关的 API 和类型
import { listIngredientsPaginated, mergeIngredients } from '#/api/content/ingredient';
import type { IngredientRead, IngredientMergePayload } from './types';
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

// --- 状态定义 ---
const visible = ref(false);
const loading = ref(false);
const searching = ref(false);

const sourceIngredientOptions = ref<{ label: string; value: string }[]>([]);
const targetIngredientOptions = ref<{ label: string; value: string }[]>([]);

const formState = reactive({
  source_ingredient_ids: [],
  target_ingredient_id: undefined,
});

const contextIngredients = ref<IngredientRead[]>([]);
const isContextMode = computed(() => contextIngredients.value.length > 0);

// --- 核心方法 ---

// open 函数，处理两种模式
async function open(selectedIngredients?: IngredientRead[]) {
  resetFormState();
  if (selectedIngredients && selectedIngredients.length > 0) {
    // 进入上下文模式
    contextIngredients.value = selectedIngredients;
    // 目标选项就是用户选中的这些
    targetIngredientOptions.value = selectedIngredients.map(i => ({ label: i.name, value: i.id }));
    // 源选项也从这里面选
    sourceIngredientOptions.value = selectedIngredients.map(i => ({ label: i.name, value: i.id }));
  } else {
    // 进入全局模式
    contextIngredients.value = [];
  }
  visible.value = true;
}

// 重置表单
function resetFormState() {
  formState.source_ingredient_ids = [];
  formState.target_ingredient_id = undefined;
  sourceIngredientOptions.value = [];
  targetIngredientOptions.value = [];
  contextIngredients.value = [];
}

function handleCancel() {
  visible.value = false;
}

// 提交合并请求
async function handleOk() {
  let finalPayload: IngredientMergePayload;

  // 根据不同模式构建 payload
  if (isContextMode.value) {
    if (!formState.target_ingredient_id) {
      message.warning('请从已选食材中选择一个作为目标');
      return;
    }
    const sourceIds = contextIngredients.value
      .map(i => i.id)
      .filter(id => id !== formState.target_ingredient_id);

    if (sourceIds.length === 0) {
      message.warning('请至少选择一个源食材和一个不同的目标食材');
      return;
    }
    finalPayload = {
      source_ingredient_ids: sourceIds,
      target_ingredient_id: formState.target_ingredient_id,
    };
  } else {
    // 全局模式
    if (!formState.target_ingredient_id || formState.source_ingredient_ids.length === 0) {
      message.warning('请搜索并选择源食材和目标食材');
      return;
    }
    if (formState.source_ingredient_ids.includes(formState.target_ingredient_id)) {
      message.error('目标食材不能是被合并的源食材之一');
      return;
    }
    finalPayload = formState as IngredientMergePayload;
  }

  loading.value = true;
  try {
    // 调用食材合并 API
    await mergeIngredients(finalPayload);
    message.success('合并成功');
    emit('success');
    handleCancel();
  } finally {
    loading.value = false;
  }
}

// 远程搜索函数
const handleSearch = debounce(async (query: string, type: 'source' | 'target') => {
  if(!query) return;
  searching.value = true;
  try {
    const response = await listIngredientsPaginated({ search: query, per_page: 20 });
    const options = response.items.map(item => ({ label: item.name, value: item.id }));
    if (type === 'source') {
      sourceIngredientOptions.value = options;
    } else {
      targetIngredientOptions.value = options;
    }
  } finally {
    searching.value = false;
  }
}, 300);

defineExpose({ open });
</script>

<template>
  <AModal
    v-model:open="visible"
    title="合并食材"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirm-loading="loading"
    width="600px"
  >
    <p class="text-gray-500 mb-4">将一个或多个“源食材”合并入一个“目标食材”。操作后，源食材将被删除，其关联的菜谱将全部转移到目标食材下。</p>

    <AForm v-if="isContextMode" layout="vertical">
      <AFormItem label="请从下列已选食材中选择一个作为“目标”（将保留）">
        <ARadioGroup v-model:value="formState.target_ingredient_id" button-style="solid">
          <ARadioButton
            v-for="ingredient in contextIngredients"
            :key="ingredient.id"
            :value="ingredient.id"
            class="m-1"
          >
            {{ ingredient.name }}
          </ARadioButton>
        </ARadioGroup>
      </AFormItem>

      <AFormItem v-if="formState.target_ingredient_id" label="以下食材将被“合并并删除”">
        <div class="flex flex-wrap gap-1">
          <ATag
            color="warning"
            v-for="ingredient in contextIngredients.filter(i => i.id !== formState.target_ingredient_id)"
            :key="ingredient.id"
          >
            {{ ingredient.name }}
          </ATag>
        </div>
      </AFormItem>
    </AForm>

    <AForm v-else layout="vertical">
      <AFormItem label="源食材 (将被合并并删除)">
        <ASelect
          v-model:value="formState.source_ingredient_ids"
          mode="multiple"
          placeholder="输入并搜索要合并的食材"
          :options="sourceIngredientOptions"
          :loading="searching"
          show-search
          :filter-option="false"
          @search="(q) => handleSearch(q, 'source')"
          allow-clear
        />
      </AFormItem>
      <AFormItem label="目标食材 (将保留)">
        <ASelect
          v-model:value="formState.target_ingredient_id"
          placeholder="输入并搜索一个最终要保留的食材"
          :options="targetIngredientOptions"
          :loading="searching"
          show-search
          :filter-option="false"
          @search="(q) => handleSearch(q, 'target')"
          allow-clear
        />
      </AFormItem>
    </AForm>
  </AModal>
</template>
