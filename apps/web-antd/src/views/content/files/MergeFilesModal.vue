// 文件位置: src/views/content/file/components/MergeFilesModal.vue

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { debounce } from 'lodash-es';
import { listFileRecords, mergeFileRecords } from '#/api/content/file-record'; // <-- 1. 引用新的API
import type { FileRecordRead, MergeRecordsPayload } from './types'; // <-- 2. 引用新的类型
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

const sourceOptions = ref<{ label: string; value: string }[]>([]);
const targetOptions = ref<{ label: string; value: string }[]>([]);

const formState = reactive({
  source_id: [],
  target_id: undefined,
});

const contextFiles = ref<FileRecordRead[]>([]);
const isContextMode = computed(() => contextFiles.value.length > 0);

// open 函数几乎和 Tag 版本一样
async function open(selectedFiles?: FileRecordRead[]) {
  resetFormState();
  if (selectedFiles && selectedFiles.length >= 2) {
    contextFiles.value = selectedFiles;
    targetOptions.value = selectedFiles.map(f => ({ label: f.original_filename, value: f.id }));
  } else {
    contextFiles.value = [];
  }
  visible.value = true;
}

function resetFormState() {
  formState.source_id = [];
  formState.target_id = undefined;
  sourceOptions.value = [];
  targetOptions.value = [];
  contextFiles.value = [];
}

function handleCancel() {
  visible.value = false;
}

// handleOk 函数几乎和 Tag 版本一样
async function handleOk() {
  let finalPayload: MergeRecordsPayload;

  if (isContextMode.value) {
    if (!formState.target_id) {
      message.warning('请从已选文件中选择一个作为目标');
      return;
    }
    const sourceIds = contextFiles.value
      .map(f => f.id)
      .filter(id => id !== formState.target_id);

    finalPayload = {
      source_id: sourceIds[0], // <-- 3. 后端接口目前是1对1合并
      target_id: formState.target_id,
    };
    // 注意：如果后端 merge 接口支持多对一，这里应为 source_record_ids: sourceIds
    if (sourceIds.length > 1) {
      message.warning('当前仅支持将一个文件合并到另一个，请重新选择或分次操作。');
      return;
    }

  } else {
    // 全局模式的逻辑...
    // ...
  }

  loading.value = true;
  try {
    await mergeFileRecords(finalPayload); // <-- 4. 调用新的API
    message.success('合并成功');
    emit('success');
    handleCancel();
  } finally {
    loading.value = false;
  }
}

// 远程搜索函数，现在搜索的是文件名
const handleSearch = debounce(async (query: string, type: 'source' | 'target') => {
  if (!query) return;
  searching.value = true;
  try {
    const response = await listFileRecords({ original_filename: query, per_page: 20 });
    const options = response.items.map(item => ({ label: item.original_filename, value: item.id }));
    if (type === 'source') {
      sourceOptions.value = options;
    } else {
      targetOptions.value = options;
    }
  } finally {
    searching.value = false;
  }
}, 300);

defineExpose({ open });
</script>

<template>
  <AModal v-model:open="visible" title="合并文件记录" @ok="handleOk" @cancel="handleCancel" :confirm-loading="loading">
    <p class="text-gray-500 mb-4">将一个“源文件记录”合并入一个“目标文件记录”。操作后，源记录将被删除，其业务关联将转移到目标记录下（如果后端实现）。</p>

    <AForm v-if="isContextMode" layout="vertical">
      <AFormItem label="请选择一个作为“目标记录”（将保留）">
        <ARadioGroup v-model:value="formState.target_id" button-style="solid">
          <ARadioButton
            v-for="file in contextFiles"
            :key="file.id"
            :value="file.id"
            class="m-1"
          >
            {{ file.original_filename }}
          </ARadioButton>
        </ARadioGroup>
      </AFormItem>
      <AFormItem v-if="formState.target_id" label="以下记录将被“合并并删除”">
        <div class="flex flex-wrap gap-1">
          <ATag
            color="warning"
            v-for="file in contextFiles.filter(f => f.id !== formState.target_id)"
            :key="file.id"
          >
            {{ file.original_filename }}
          </ATag>
        </div>
      </AFormItem>
    </AForm>

    <AForm v-else layout="vertical">
    </AForm>
  </AModal>
</template>
