<script lang="ts" setup>
import { ref, watch, h } from 'vue';
import { Button, Input, Upload, Avatar, Card, message } from 'ant-design-vue';
import {
  PlusOutlined,
  DeleteOutlined,
  HolderOutlined,
  UploadOutlined,
  PictureOutlined,
} from '@ant-design/icons-vue';
import draggable from 'vuedraggable';

// --- 定义步骤的数据结构 ---
interface Step {
  text: string;
  image_url: string | null;
}

// --- 组件通信: v-model ---
const props = defineProps<{
  modelValue: string; // 父组件传入的是一个 JSON 字符串
}>();

const emit = defineEmits(['update:modelValue']);

// --- 内部状态 ---
const internalSteps = ref<Step[]>([]);

// --- 核心逻辑 ---

// 当父组件传入数据时，解析 JSON 字符串
watch(
  () => props.modelValue,
  (newValue) => {
    try {
      if (newValue && typeof newValue === 'string') {
        const parsed = JSON.parse(newValue);
        if (Array.isArray(parsed)) {
          internalSteps.value = parsed;
          return;
        }
      }
      // 如果传入的不是合法的步骤数组JSON，则将其作为第一步的文本
      internalSteps.value = [{ text: newValue || '', image_url: null }];
    } catch (e) {
      internalSteps.value = [{ text: newValue || '', image_url: null }];
    }
  },
  { immediate: true },
);

// 当内部步骤列表变化时，转换为 JSON 字符串并通知父组件
function emitUpdate() {
  emit('update:modelValue', JSON.stringify(internalSteps.value));
}

function addStep() {
  internalSteps.value.push({ text: '', image_url: null });
  emitUpdate();
}

function removeStep(index: number) {
  internalSteps.value.splice(index, 1);
  emitUpdate();
}

// 模拟图片上传逻辑
function handleImageUpload(info: any, step: Step) {
  // 在真实项目中，这里应调用上传接口
  if (info.file.status === 'uploading') {
    return;
  }
  if (info.file.status === 'done') {
    // 假设上传成功后，后端返回一个可访问的 URL
    const imageUrl = info.file.response.url; // 请根据你的API响应调整
    step.image_url = imageUrl;
    emitUpdate();
    message.success(`${info.file.name} 上传成功`);
  } else if (info.file.status === 'error') {
    message.error(`${info.file.name} 上传失败.`);
  }
}
</script>

<template>
  <div class="step-editor">
    <draggable v-model="internalSteps" item-key="index" handle=".drag-handle" @end="emitUpdate">
      <template #item="{ element: step, index }">
        <Card class="mb-4">
          <div class="flex gap-4">
            <div class="flex flex-col items-center pt-2">
              <span class="font-bold text-lg">{{ index + 1 }}</span>
              <HolderOutlined class="drag-handle cursor-move text-gray-400 mt-2" />
            </div>

            <div class="flex-grow">
              <Input.TextArea
                v-model:value="step.text"
                placeholder="请输入这一步做什么..."
                :rows="4"
                @change="emitUpdate"
              />
              <div class="mt-2 flex items-center gap-4">
                <Avatar :size="64" shape="square" :src="step.image_url">
                  <template #icon><PictureOutlined /></template>
                </Avatar>
                <Upload
                  name="stepImage"
                  :show-upload-list="false"
                  action="/api/v1/files/upload"
                  @change="(info) => handleImageUpload(info, step)"
                >
                  <Button :icon="h(UploadOutlined)">
                    {{ step.image_url ? '更换步骤图' : '上传步骤图' }}
                  </Button>
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

    <Button type="dashed" block @click="addStep">
      <PlusOutlined />
      添加新步骤
    </Button>
  </div>
</template>
