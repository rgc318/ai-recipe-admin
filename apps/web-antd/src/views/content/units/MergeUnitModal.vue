<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { debounce } from 'lodash-es';
import { listUnitsPaginated, mergeUnits } from '#/api/content/unit';
import type { UnitRead, UnitMergeData } from './types';
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

const sourceUnitOptions = ref<{ label: string; value: string }[]>([]);
const targetUnitOptions = ref<{ label: string; value: string }[]>([]);

const formState = reactive<{
  source_unit_ids: string[];
  target_unit_id: string | undefined;
}>({
  source_unit_ids: [],
  target_unit_id: undefined,
});

const contextUnits = ref<UnitRead[]>([]);
const isContextMode = computed(() => contextUnits.value.length > 0);

async function open(selectedUnits?: UnitRead[]) {
  resetFormState();
  if (selectedUnits && selectedUnits.length >= 2) {
    contextUnits.value = selectedUnits;
    targetUnitOptions.value = selectedUnits.map(u => ({ label: u.name, value: u.id }));
  } else {
    contextUnits.value = [];
  }
  visible.value = true;
}

function resetFormState() {
  formState.source_unit_ids = [];
  formState.target_unit_id = undefined;
  sourceUnitOptions.value = [];
  targetUnitOptions.value = [];
  contextUnits.value = [];
}

function handleCancel() {
  visible.value = false;
}

async function handleOk() {
  let finalPayload: UnitMergeData;
  if (isContextMode.value) {
    if (!formState.target_unit_id) {
      message.warning('请从已选单位中选择一个作为目标');
      return;
    }
    const sourceIds = contextUnits.value
      .map(u => u.id)
      .filter(id => id !== formState.target_unit_id);
    finalPayload = {
      source_unit_ids: sourceIds,
      target_unit_id: formState.target_unit_id,
    };
  } else {
    if (!formState.target_unit_id || formState.source_unit_ids.length === 0) {
      message.warning('请搜索并选择源单位和目标单位');
      return;
    }
    if (formState.source_unit_ids.includes(formState.target_unit_id)) {
      message.error('目标单位不能是被合并的源单位之一');
      return;
    }
    finalPayload = formState as UnitMergeData;
  }
  loading.value = true;
  try {
    await mergeUnits(finalPayload);
    message.success('合并成功');
    emit('success');
    handleCancel();
  } finally {
    loading.value = false;
  }
}

const searchUnits = debounce(async (query: string, optionsRef: typeof sourceUnitOptions) => {
  if (!query) {
    optionsRef.value = [];
    return;
  }
  searching.value = true;
  try {
    const { items } = await listUnitsPaginated({ name: query, per_page: 50 });
    optionsRef.value = items.map(item => ({ label: item.name, value: item.id }));
  } finally {
    searching.value = false;
  }
}, 300);

const handleSourceSearch = (query: string) => searchUnits(query, sourceUnitOptions);
const handleTargetSearch = (query: string) => searchUnits(query, targetUnitOptions);

defineExpose({ open });
</script>

<template>
  <AModal
    v-model:open="visible"
    title="合并单位"
    @ok="handleOk"
    @cancel="handleCancel"
    :confirm-loading="loading"
  >
    <p class="text-gray-500 mb-4">将一个或多个“源单位”合并入一个“目标单位”。操作后，源单位将被删除，其关联的配料将全部转移到目标单位下。</p>
    <AForm v-if="isContextMode" layout="vertical">
      <AFormItem label="请从下列单位中选择一个作为“目标”（将保留）">
        <ARadioGroup v-model:value="formState.target_unit_id" button-style="solid">
          <ARadioButton
            v-for="unit in contextUnits"
            :key="unit.id"
            :value="unit.id"
            class="m-1"
          >
            {{ unit.name }}
          </ARadioButton>
        </ARadioGroup>
      </AFormItem>
      <AFormItem v-if="formState.target_unit_id" label="以下单位将被“合并并删除”">
        <div class="flex flex-wrap gap-1">
          <ATag
            color="warning"
            v-for="unit in contextUnits.filter(u => u.id !== formState.target_unit_id)"
            :key="unit.id"
          >
            {{ unit.name }}
          </ATag>
        </div>
      </AFormItem>
    </AForm>
    <AForm v-else layout="vertical">
      <AFormItem label="源单位 (将被合并并删除)">
        <ASelect
          v-model:value="formState.source_unit_ids"
          mode="multiple"
          placeholder="输入并搜索要合并的单位"
          :options="sourceUnitOptions"
          :loading="searching"
          show-search
          :filter-option="false"
          @search="handleSourceSearch"
          allow-clear
        />
      </AFormItem>
      <AFormItem label="目标单位 (将保留)">
        <ASelect
          v-model:value="formState.target_unit_id"
          placeholder="输入并搜索一个最终要保留的单位"
          :options="targetUnitOptions"
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
