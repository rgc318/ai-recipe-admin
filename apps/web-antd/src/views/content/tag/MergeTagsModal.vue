<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { debounce } from 'lodash-es';
import { listTagsPaginated, mergeTags } from '#/api/content/tag';
import type { TagRead, TagMergeData } from './types';
import {
  Modal as AModal,
  Form as AForm,
  FormItem as AFormItem,
  Select as ASelect,
  message,
  Tag as ATag,
  RadioGroup as ARadioGroup,   // <-- 【核心新增】
  RadioButton as ARadioButton // <-- 【核心新增】
} from 'ant-design-vue';

const emit = defineEmits(['success']);

const visible = ref(false);
const loading = ref(false);
const searching = ref(false);

const sourceTagOptions = ref<{ label: string; value: string }[]>([]);
const targetTagOptions = ref<{ label: string; value: string }[]>([]);

const formState = reactive({
  source_tag_ids: [],
  target_tag_id: undefined,
});

// ▼▼▼ 【核心新增】用于存储上下文模式下传入的标签 ▼▼▼
const contextTags = ref<TagRead[]>([]);
const isContextMode = computed(() => contextTags.value.length > 0);

// ▼▼▼ 【核心修改】open 函数现在能接收可选参数，并处理两种模式 ▼▼▼
async function open(selectedTags?: TagRead[]) {
  // 每次打开都重置所有状态
  resetFormState();

  if (selectedTags && selectedTags.length >= 2) {
    // --- 进入上下文模式 ---
    contextTags.value = selectedTags;
    // 目标标签的选项，就是用户选中的这几个标签
    targetTagOptions.value = selectedTags.map(t => ({ label: t.name, value: t.id }));
  } else {
    // --- 进入全局模式 ---
    contextTags.value = [];
  }

  visible.value = true;
}

// 抽离出一个重置函数，方便复用
function resetFormState() {
  formState.source_tag_ids = [];
  formState.target_tag_id = undefined;
  sourceTagOptions.value = [];
  targetTagOptions.value = [];
  contextTags.value = [];
}

function handleCancel() {
  visible.value = false;
}

async function handleOk() {
  let finalPayload: TagMergeData;

  if (isContextMode.value) {
    // 在上下文模式下，源标签是所有选中标签里，排除了目标标签的那些
    if (!formState.target_tag_id) {
      message.warning('请从已选标签中选择一个作为目标');
      return;
    }
    const sourceIds = contextTags.value
      .map(t => t.id)
      .filter(id => id !== formState.target_tag_id);

    finalPayload = {
      source_tag_ids: sourceIds,
      target_tag_id: formState.target_tag_id,
    };

  } else {
    // 在全局模式下，进行常规校验
    if (!formState.target_tag_id || formState.source_tag_ids.length === 0) {
      message.warning('请搜索并选择源标签和目标标签');
      return;
    }
    if (formState.source_tag_ids.includes(formState.target_tag_id)) {
      message.error('目标标签不能是被合并的源标签之一');
      return;
    }
    finalPayload = formState as TagMergeData;
  }

  loading.value = true;
  try {
    await mergeTags(finalPayload);
    message.success('合并成功');
    emit('success');
    handleCancel();
  } finally {
    loading.value = false;
  }
}

// ... 远程搜索函数 handleSourceSearch 和 handleTargetSearch 保持不变 ...
const handleSourceSearch = debounce(async (query: string) => { /* ... */ });
const handleTargetSearch = debounce(async (query: string) => { /* ... */ });

defineExpose({ open });
</script>

<template>
  <AModal
    v-model:open="visible"
    title="合并标签"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirm-loading="loading"
  >
    <p class="text-gray-500 mb-4">将一个或多个“源标签”合并入一个“目标标签”。操作后，源标签将被删除，其关联的菜谱将全部转移到目标标签下。</p>

    <AForm v-if="isContextMode" layout="vertical">

      <AFormItem label="请从下列标签中选择一个作为“目标”（将保留）">
        <ARadioGroup v-model:value="formState.target_tag_id" button-style="solid">
          <ARadioButton
            v-for="tag in contextTags"
            :key="tag.id"
            :value="tag.id"
            class="m-1"
          >
            {{ tag.name }}
          </ARadioButton>
        </ARadioGroup>
      </AFormItem>

      <AFormItem v-if="formState.target_tag_id" label="以下标签将被“合并并删除”">
        <div class="flex flex-wrap gap-1">
          <ATag
            color="warning"
            v-for="tag in contextTags.filter(t => t.id !== formState.target_tag_id)"
            :key="tag.id"
          >
            {{ tag.name }}
          </ATag>
        </div>
      </AFormItem>

    </AForm>


    <AForm v-else layout="vertical">
      <AFormItem label="源标签 (将被合并并删除)">
        <ASelect
          v-model:value="formState.source_tag_ids"
          mode="multiple"
          placeholder="输入并搜索要合并的标签"
          :options="sourceTagOptions"
          :loading="searching"
          show-search
          :filter-option="false"
          @search="handleSourceSearch"
          allow-clear
        />
      </AFormItem>
      <AFormItem label="目标标签 (将保留)">
        <ASelect
          v-model:value="formState.target_tag_id"
          placeholder="输入并搜索一个最终要保留的标签"
          :options="targetTagOptions"
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
