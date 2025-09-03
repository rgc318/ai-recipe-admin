<script lang="ts" setup>
import { h, ref, watch } from 'vue';
import {
  Button,
  Input,
  Upload,
  Card,
  message,
  type UploadFile,
  type UploadChangeParam,
} from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined, HolderOutlined, ClockCircleOutlined } from '@ant-design/icons-vue';
import draggable from 'vuedraggable';
import { v4 as uuidv4 } from 'uuid';

// 1. 【核心】导入正确的类型
import type { RecipeStepInput, FileRecordRead } from '../types';

// 为UI列表项添加一个唯一ID，用于v-for的key
interface DraggableStepItem extends RecipeStepInput {
  ui_id: string;
}

// --- 组件通信 (v-model) ---
const props = defineProps<{
  modelValue: RecipeStepInput[];
}>();
const emit = defineEmits(['update:modelValue']);

// --- 内部状态 ---
const internalSteps = ref<DraggableStepItem[]>([]);

// --- 核心逻辑 ---

// 当父组件传入数据时，同步到内部状态
// watch 1: 当父组件传入扁平数据时，转换为UI的嵌套分组列表
watch(
  () => props.modelValue,
  (newValue) => {
    // 1. 增加一个“防御性”检查，防止无限循环
    // 只有当父组件传入的数据和当前组件的纯数据不一致时，才进行更新
    const currentPureSteps = internalSteps.value.map(({ ui_id, ...rest }) => rest);
    if (JSON.stringify(newValue) === JSON.stringify(currentPureSteps)) {
      return; // 数据已经同步，无需任何操作
    }

    // 2. 核心修改：复用已存在的 ui_id，而不是每次都生成新的
    internalSteps.value = (newValue || []).map((step, index) => {
      // 尝试在当前内部列表的相同位置寻找已存在的步骤
      const existingStep = internalSteps.value[index];

      return {
        ...step,
        // 如果能找到，就复用它的 ui_id；如果找不到（说明是新增的步骤），才生成一个新的
        ui_id: existingStep ? existingStep.ui_id : uuidv4(),
      };
    });
  },
  { immediate: true, deep: true },
);

// 使用一个 deep watcher 自动将任何变更通知给父组件
watch(
  internalSteps,
  (newValue) => {
    // 在通知父组件前，移除临时的 ui_id 属性
    const pureSteps = newValue.map(({ ui_id, ...rest }) => rest);
    if (JSON.stringify(props.modelValue) !== JSON.stringify(pureSteps)) {
      emit('update:modelValue', pureSteps);
    }
  },
  { deep: true },
);

// 添加一个空的步骤
function addStep() {
  internalSteps.value.push({
    ui_id: uuidv4(),
    instruction: '',
    duration: null,
    image_ids: [],
  });
}

// 移除一个步骤
function removeStep(index: number) {
  internalSteps.value.splice(index, 1);
}

// 处理图片上传与删除
function handleImageChange(info: UploadChangeParam, step: DraggableStepItem) {
  const newImageIds: string[] = info.fileList
    .map((file) => {
      if (file.status === 'done') {
        // 新上传的文件，从 response 获取 ID
        return file.response?.data?.id || file.uid;
      }
      // 已存在的文件，直接使用它的 uid (我们在 mapIdsToFileList 中设置了)
      return file.uid;
    })
    .filter((id): id is string => !!id);

  step.image_ids = newImageIds;
}

// 将 image_ids 映射为 antd Upload 组件需要的 fileList 格式
function mapIdsToFileList(image_ids: string[] = []): UploadFile[] {
  return image_ids.map(id => ({
    uid: id,
    name: `图片_${id.substring(0, 6)}`,
    status: 'done',
    url: '', // TODO: 需要一个API根据ID批量获取预览URL
  }));
}
</script>

<template>
  <div class="step-editor">
    <draggable v-model="internalSteps" :item-key="'ui_id'" handle=".drag-handle" class="space-y-4">

<!--      <template #header>-->
<!--        &lt;!&ndash; 空插槽，不做任何事情 &ndash;&gt;-->
<!--      </template>-->
<!--      <template #footer>-->
<!--        &lt;!&ndash; 空插槽，不做任何事情 &ndash;&gt;-->
<!--      </template>-->

      <template #item="{ element: step, index }">
        <Card>
          <div class="flex gap-4">
            <div class="flex flex-col items-center pt-2 text-center">
              <span class="font-bold text-lg">{{ index + 1 }}</span>
              <HolderOutlined class="drag-handle cursor-move text-gray-400 mt-2 text-lg" />
            </div>

            <div class="flex-grow">
              <Input.TextArea
                v-model:value="step.instruction"
                placeholder="请输入这一步做什么..."
                :rows="4"
              />

              <div class="mt-4">
                <Input
                  v-model:value="step.duration"
                  placeholder="例如: 15分钟"
                  style="width: 200px;"
                >
                  <template #addonBefore>
                    <ClockCircleOutlined />
                    <span class="ml-1">耗时</span>
                  </template>
                </Input>
              </div>

              <div class="mt-4">
                <p class="font-semibold mb-2 text-gray-600">步骤图片 (可上传多张)</p>
                <Upload
                  name="file"
                  action="/api/v1/files/upload?profile=recipes"
                  list-type="picture-card"
                  multiple
                  :file-list="mapIdsToFileList(step.image_ids)"
                  @change="(info) => handleImageChange(info, step)"
                >
                  <div>
                    <PlusOutlined />
                    <div class="mt-2">上传图片</div>
                  </div>
                </Upload>
              </div>
            </div>

            <Button
              type="text"
              danger
              shape="circle"
              :icon="h(DeleteOutlined)"
              @click="removeStep(index)"
            />
          </div>
        </Card>
      </template>
    </draggable>

    <Button type="dashed" block @click="addStep" class="mt-4">
      <PlusOutlined />
      添加新步骤
    </Button>
  </div>
</template>
