<script lang="ts" setup>
import { h, ref, watch } from 'vue';
import {
  Button,
  Input,
  Upload,
  Card,
  message,
  type UploadFile,
  type UploadChangeParam, // 虽然 handleImageChange 删除了，但类型可能仍有用，可酌情保留或删除
} from 'ant-design-vue';
import { PlusOutlined, DeleteOutlined, HolderOutlined, ClockCircleOutlined } from '@ant-design/icons-vue';
import draggable from 'vuedraggable';
import { v4 as uuidv4 } from 'uuid';
import { useUploader } from '#/hooks/web/useUploader';

// 1. 【核心】导入正确的类型
import type { RecipeStepInput} from '../types';
import type {FileRecordRead} from "#/views/management/files/types";
import {generatePresignedUploadPolicy, registerFile} from "#/api/management/files/file";
import axios from "axios";


// --- 类型定义 ---
// 为UI列表项添加一个唯一ID，用于v-for的key
interface DraggableStepItem extends RecipeStepInput {
  ui_id: string;
  images?: UploadFile[]; // 明确 UI 层面使用的 images 类型
}

// --- 1. 定义所有 state (状态) ---
const stepUploaders = ref<Record<string, { customRequest: Function }>>({});
const internalSteps = ref<DraggableStepItem[]>([]);

// --- 组件通信 (v-model) ---
const props = defineProps<{
  modelValue: RecipeStepInput[];
  isCreateMode: boolean; // <-- 【新增】
  recipeId: string;      // <-- 【新增】
}>();
const emit = defineEmits(['update:modelValue']);


// 为每一个步骤的上传器创建一个映射
// key 是步骤的 ui_id, value 是一个 uploader 实例

// 【核心改造】为每一个步骤创建包含条件化逻辑的 uploader
watch(internalSteps, (steps) => {
  steps.forEach(step => {
    if (!stepUploaders.value[step.ui_id]) {
      // 为每个步骤创建一个专属的 customRequest 函数
      const customRequestForStep = async ({ file, onSuccess, onError, onProgress }: any) => {
        try {
          // 步骤 A: 根据模式，获取上传策略
          const policyRes = await generatePresignedUploadPolicy({
            original_filename: file.name,
            content_type: file.type,
            profile_name: props.isCreateMode ? 'general_files' : 'recipe_images',
            path_params: props.isCreateMode ? undefined : { recipe_id: props.recipeId },
          });
          const policy = policyRes;

          // 步骤 B: 物理上传
          const formData = new FormData();
          Object.keys(policy.fields).forEach((key) => formData.append(key, policy.fields[key]));
          formData.append('file', file);
          await axios.post(policy.url, formData, {
            onUploadProgress: (event) => {
              if (event.total) onProgress({ percent: Math.round((event.loaded * 100) / event.total) });
            },
          });

          // 步骤 C: 登记文件
          const registerRes = await registerFile({
            object_name: policy.object_name,
            original_filename: file.name,
            content_type: file.type,
            file_size: file.size,
            profile_name: 'recipe_images',
          });

          // 【关键】调用 onSuccess 将结果传给 Antd Upload 组件
          // Upload 组件会自动更新 fileList，后续的响应式流程会自动处理
          onSuccess(registerRes);
          message.success(`步骤图片 [${file.name}] 上传成功`);

        } catch (error: any) {
          message.error(`图片上传失败: ${error.message || '未知错误'}`);
          onError(error);
        }
      };

      stepUploaders.value[step.ui_id] = {
        customRequest: customRequestForStep,
      };
    }
  });
}, { deep: true, immediate: true });

// 通用的 beforeUpload
const beforeUpload = (file: File) => {
  const isJpgOrPng = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isJpgOrPng || !isLt10M) {
    message.error('请上传 10MB 以下的 JPG/PNG/WEBP 格式图片!');
    return false;
  }
  return true;
};



// --- 核心逻辑 ---

// 将服务端的图片数据结构映射为 Ant Design Upload 组件需要的 fileList 结构
function mapImagesToUploadFileList(images: FileRecordRead[] = []): UploadFile[] {
  return images.map(img => ({
    uid: img.id,
    name: img.original_filename || `image_${img.id}`,
    status: 'done',
    url: img.url,
    response: { id: img.id }, // 响应中包含id，方便后续提取
  }));
}

// 侦听器: 同步父组件传入的数据
watch(() => props.modelValue, (newValue) => {
    const currentPureSteps = internalSteps.value.map(({ ui_id, images, ...rest }) => ({
      ...rest,
      image_ids: images?.map(file => file.response?.id || file.uid).filter(id => id) || [],
    }));

    if (JSON.stringify(newValue) === JSON.stringify(currentPureSteps)) {
      return;
    }

    internalSteps.value = (newValue || []).map((step, index) => {
      const existingStep = internalSteps.value[index];
      const initialFileList = mapImagesToUploadFileList(step.images);
      return {
        ...step,
        images: initialFileList,
        ui_id: existingStep ? existingStep.ui_id : uuidv4(),
      };
    });
  },
  { immediate: true, deep: true },
);

// 侦听器: 将内部状态的变更通知给父组件
watch(internalSteps, (newValue) => {
    const pureSteps: RecipeStepInput[] = newValue.map(({ ui_id, images, ...rest }) => ({
      ...rest,
      image_ids: images?.map(file => {
        return file.response?.id || file.uid;
      }).filter((id): id is string => !!id) || [],
    }));

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
    images: [], // 【已修正】确保新对象数据结构完整
  });
}

// 移除一个步骤
function removeStep(index: number) {
  // 在 splice 之前获取要被删除的步骤的 ui_id
  const stepToRemove = internalSteps.value[index];
  if (stepToRemove) {
    // 清理与该步骤关联的 uploader 实例，防止内存泄漏
    delete stepUploaders.value[stepToRemove.ui_id];
  }
  internalSteps.value.splice(index, 1);
}

// 【已移除】 handleImageChange 和 mapStepImagesToFileList 函数已被删除，因为它们是冗余的。

</script>

<template>
  <div class="step-editor">
    <draggable v-model="internalSteps" :item-key="'ui_id'" handle=".drag-handle" class="space-y-4">
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
                  v-if="stepUploaders[step.ui_id]"
                  name="file"
                  list-type="picture-card"
                  multiple
                  v-model:file-list="step.images"
                  :before-upload="beforeUpload"
                  :custom-request="stepUploaders[step.ui_id].customRequest"
                >
                  <div>
                    <PlusOutlined />
                    <div style="margin-top: 8px">上传</div>
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
