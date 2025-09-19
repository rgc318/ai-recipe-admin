<script lang="ts" setup>
import {ref, h, computed, watch, onUnmounted, nextTick} from 'vue';
import {
  Form,
  FormItem,
  Input,
  Select,
  TreeSelect,
  Upload,
  message,
  Button,
  Row,
  Col,
  type UploadFile,
  type UploadChangeParam,
} from 'ant-design-vue';
import { LoadingOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { storeToRefs } from 'pinia';
import { debounce } from 'lodash-es';
import { useUploader } from '#/hooks/web/useUploader'; // 导入我们新的 Hook
import type { FileRecordRead } from '#/views/content/files/types';
import { useRecipeReferenceStore } from '#/store/modules/recipeReference';
import { searchTags } from '#/api/content/tag';
import type { TagRead, RecipeCreateData } from '../types';

// 【新增】导入你的通用上传API
import { uploadToCloud, generatePresignedUploadPolicy, registerFile } from '#/api/content/file';
// 【新增】导入 axios 用于物理上传
import axios from 'axios';

// --- 【核心修改】初始化上传器 ---
// --- 初始化上传器 (不依赖 props, 位置可以不变) ---
const isCoverUploading = ref(false);
const isGalleryUploading = ref(false); // 如果画廊图也用此逻辑，则需要

// --- 【核心修改】为封面图和画廊图准备本地预览状态 ---
const coverPreviewUrl = ref('');
const galleryFileList = ref<UploadFile[]>([]); // 完全接管 antd Upload 的 fileList

// --- 组件通信 ---
const props = defineProps<{
  modelValue: RecipeCreateData;
  isCreateMode: boolean; // <-- 【新增】接收 prop
  recipeId: string;      // <-- 【新增】接收 prop
}>();
const emit = defineEmits(['update:modelValue']);


// --- 使用 computed 属性代理 v-model ---
const formState = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

// 1. 定义最大分类数
const MAX_CATEGORIES = 5;

// 在你的 state 定义区域
const MAX_TAGS = 8; // 定义最大标签数

// 定义最大画廊图片数
const MAX_GALLERY_IMAGES = 9; // 例如，最多9张

// --- 【核心修改】通用的 beforeUpload (包含即时预览逻辑) ---
const beforeUpload = (file: File, isCover: boolean = false) => {
  const isJpgOrPng = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isJpgOrPng || !isLt10M) {
    message.error('请上传 10MB 以下的 JPG/PNG/WEBP 格式图片!');
    return Upload.LIST_IGNORE;
  }

  // ▼▼▼ 【核心修改】在这里为画廊图片添加数量前置校验 ▼▼▼
  if (!isCover) { // 如果不是封面图（即，是画廊图）
    if (galleryFileList.value.length >= MAX_GALLERY_IMAGES) {
      message.error(`最多只能上传 ${MAX_GALLERY_IMAGES} 张画廊图片`);
      // 返回 false 会立即中断上传流程
      return Upload.LIST_IGNORE;
    }
  }

  // 为封面图生成单独的预览
  if (isCover) {
    if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
    coverPreviewUrl.value = URL.createObjectURL(file);
  }

  return true;
};



// --- 【核心修改】封面上传逻辑 ---
const handleCoverChange = (info: UploadChangeParam) => {
  if (info.file.status === 'done') {
    const fileRecord = info.file.response as FileRecordRead;
    formState.value.cover_image_id = fileRecord.id;
    message.success(`封面 [${info.file.name}] 上传成功`);
    // 上传成功后，清空本地预览，让预览图指向真实的（临时）URL
    if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
    coverPreviewUrl.value = '';
    // 同时更新封面图对象，以便预览
    formState.value.cover_image = fileRecord;
  } else if (info.file.status === 'error') {
    message.error(`封面 [${info.file.name}] 上传失败`);
  }
}

// 封面图的 customRequest
const coverCustomRequest = async ({ file, onSuccess, onError, onProgress }: any) => {
  isCoverUploading.value = true;
  try {
    // --- 步骤 A: 根据模式，调用不同的策略生成接口 ---
    const policyRes = await generatePresignedUploadPolicy({
      original_filename: file.name,
      content_type: file.type,
      // 【关键】如果是创建模式，使用通用配置；如果是编辑模式，使用专用配置
      profile_name: props.isCreateMode ? 'general_files' : 'recipe_images',
      // 【关键】如果是编辑模式，传递 recipe_id
      path_params: props.isCreateMode ? undefined : { recipe_id: props.recipeId },
    });
    const policy = policyRes;

    // --- 步骤 B: 物理上传文件到云 (通用逻辑) ---
    const etag = await uploadToCloud(
      policy,
      file,
      (percent) => onProgress({ percent })
    );

    // --- 步骤 C: 根据模式，执行不同的后续操作 ---
    if (props.isCreateMode) {
      // 创建模式：只登记文件，并暂存文件记录ID
      const registerRes = await registerFile({
        object_name: policy.object_name,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        // 【注意】这里登记时，可以告诉后端这个文件最终要用于哪个 profile
        profile_name: 'recipe_images',
        etag: etag, // <-- 传递 ETag
      });


      message.success('封面图已准备就绪');
      onSuccess(registerRes);

      // 【保留】本地预览的清理逻辑可以放在这里
      if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
      coverPreviewUrl.value = '';
    } else {
      // 编辑模式：由于后端策略已经将文件直接传到正确位置，
      // 我们只需要一个文件记录来更新UI即可。
      // (这个逻辑可能需要根据你的后端实现微调，这里假设和创建模式类似)
      const registerRes = await registerFile({
        object_name: policy.object_name,
        original_filename: file.name,
        content_type: file.type,
        file_size: file.size,
        profile_name: 'recipe_images',
        etag: etag, // <-- 传递 ETag
      });

      message.success('封面图更新成功！');
      onSuccess(registerRes);
    }
  } catch (error: any) {
    message.error(`上传失败: ${error.message || '未知错误'}`);
    onError(error);
  } finally {
    isCoverUploading.value = false;
    // ... 清理本地预览的逻辑 ...
  }
};


// 2. 创建一个计算属性，用于动态生成带禁用状态的树数据
const limitedTreeData = computed(() => {
  const isLimitReached = formState.value.category_ids?.length >= MAX_CATEGORIES;

  // 递归函数，用于遍历并修改树的每个节点
  const processNode = (node) => {
    const isSelected = formState.value.category_ids?.includes(node.id);
    const shouldBeDisabled = isLimitReached && !isSelected;

    const newNode = {
      ...node,
      disabled: shouldBeDisabled
    };

    if (node.children) {
      newNode.children = node.children.map(processNode);
    }

    return newNode;
  };

  return allCategories.value.map(processNode);
});

const galleryCustomRequest = async ({ file, onSuccess, onError, onProgress }: any) => {
  isGalleryUploading.value = true;
  try {
    // 【这里的逻辑和 coverCustomRequest 完全一样】
    const policyRes = await generatePresignedUploadPolicy({
      original_filename: file.name,
      content_type: file.type,
      profile_name: props.isCreateMode ? 'general_files' : 'recipe_images',
      path_params: props.isCreateMode ? undefined : { recipe_id: props.recipeId },
    });
    const policy = policyRes;

    const etag = await uploadToCloud(
      policy,
      file,
      (percent) => onProgress({ percent })
    );

    // 【这里的逻辑不同】
    // 对于画廊，我们不需要在 customRequest 内部直接修改 formState。
    // 我们只需要注册文件，然后把成功的结果通过 onSuccess 传出去，
    // 让 handleGalleryChange 函数去负责更新 fileList 和 formState。
    const registerRes = await registerFile({
      object_name: policy.object_name,
      original_filename: file.name,
      content_type: file.type,
      file_size: file.size,
      profile_name: 'recipe_images',
      etag: etag, // <-- 传递 ETag
    });

    // 把后端返回的完整文件信息传递给 antd Upload 组件
    onSuccess(registerRes);

  } catch (error: any) {
    message.error(`上传失败: ${error.message || '未知错误'}`);
    onError(error);
  } finally {
    isGalleryUploading.value = false;
  }
};

// --- 状态与逻辑 ---
const tagOptions = ref<TagRead[]>([]);
const tagSearching = ref(false);

// 从 Pinia Store 获取分类树数据
const referenceStore = useRecipeReferenceStore();
const { allCategories } = storeToRefs(referenceStore);

// 难度等级选项
const difficultyOptions = [
  { value: '简单', label: '简单' },
  { value: '中等', label: '中等' },
  { value: '困难', label: '困难' },
];

// 标签远程搜索 (带防抖)
const handleTagSearch = debounce(async (query: string) => {
  if (!query) {
    tagOptions.value = [];
    return;
  }
  tagSearching.value = true;
  try {
    const response = await searchTags({ name: query });

    // 【核心修正】过滤掉与当前输入完全一样的选项
    // 我们将后端返回的列表进行过滤，只保留那些名称和当前输入值（忽略大小写和前后空格）不完全一样的项
    const cleanQuery = query.trim().toLowerCase();
    tagOptions.value = response.items.filter(
      tag => tag.name.toLowerCase() !== cleanQuery
    );

  } catch (error) {
    message.error('搜索标签失败');
  } finally {
    tagSearching.value = false;
  }
}, 300);

// --- 【核心修改】画廊图片上传/删除逻辑 ---
const handleGalleryChange = ({ fileList }: UploadChangeParam) => {
  // antd 的 onChange 会在成功、失败、删除时都触发
  // 我们直接用当前的 fileList 来同步我们的 ID 列表
  galleryFileList.value = fileList; // 更新本地 fileList

  const newImageIds: string[] = fileList
    .map(f => f.response?.id || f.uid) // response 是我们 customRequest 中 onSuccess 返回的
    .filter((id): id is string => !!id);

  formState.value.gallery_image_ids = newImageIds;
}




// --- 侦听器：当外部数据加载完成时，初始化 fileList ---
watch(() => props.modelValue.gallery_images, (newImages) => {
  galleryFileList.value = newImages?.map(img => ({
    uid: img.id,
    name: img.original_filename,
    status: 'done',
    url: img.url,
    response: { data: img }, // 假设 response 结构是 { data: FileRecordRead }
  })) || [];
}, { immediate: true, deep: true }); // deep: true 确保数组内部变化也能被侦测到

onUnmounted(() => {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(coverPreviewUrl.value);
  }
});

// 在 category 的 watch 后面，添加一个新的 watch
watch(() => formState.value.tags, (newValue, oldValue) => {
  if (newValue && newValue.length > MAX_TAGS) {
    message.warning(`最多只能添加 ${MAX_TAGS} 个标签`);
    // 立即将值恢复到超限之前的状态
    nextTick(() => {
      formState.value.tags = oldValue;
    });
  }
});
</script>

<template>
  <Form :model="formState" layout="vertical">
    <FormItem label="菜谱标题" name="title" :rules="[{ required: true, message: '请输入菜谱标题' }]">
      <Input v-model:value="formState.title" placeholder="给你的菜谱起个吸引人的名字吧" />
    </FormItem>

    <FormItem label="菜谱描述" name="description">
      <Input.TextArea
        v-model:value="formState.description"
        :rows="4"
        placeholder="简单介绍一下这道菜的特色和故事..."
      />
    </FormItem>

    <Row :gutter="16">
      <Col :xs="24" :sm="8">
        <FormItem label="准备时间" name="prep_time">
          <Input v-model:value="formState.prep_time" placeholder="例如: 15分钟" />
        </FormItem>
      </Col>
      <Col :xs="24" :sm="8">
        <FormItem label="烹饪时间" name="cook_time">
          <Input v-model:value="formState.cook_time" placeholder="例如: 30分钟" />
        </FormItem>
      </Col>
      <Col :xs="24" :sm="8">
        <FormItem label="份量" name="servings">
          <Input v-model:value="formState.servings" placeholder="例如: 2-3人份" />
        </FormItem>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :xs="24" :sm="8">
        <FormItem label="难度等级" name="difficulty">
          <Select
            v-model:value="formState.difficulty"
            :options="difficultyOptions"
            placeholder="选择难度等级"
            allow-clear
          />
        </FormItem>
      </Col>
    </Row>

    <FormItem label="厨具清单" name="equipment">
      <Input.TextArea
        v-model:value="formState.equipment"
        :rows="3"
        placeholder="列出需要的特殊厨具，每行一个"
      />
    </FormItem>

    <FormItem label="作者小贴士" name="author_notes">
      <Input.TextArea
        v-model:value="formState.author_notes"
        :rows="4"
        placeholder="分享一些制作技巧、注意事项或背后的故事..."
      />
    </FormItem>
    <FormItem label="封面图片" name="cover_image_id">
      <Upload
        name="file"
        list-type="picture-card"
        class="avatar-uploader"
        :show-upload-list="false"
        :before-upload="(file) => beforeUpload(file, true)"
        :custom-request="coverCustomRequest"
        @change="handleCoverChange"
      >
        <img v-if="coverPreviewUrl || formState.cover_image?.url" :src="coverPreviewUrl || formState.cover_image.url" alt="封面" class="w-full h-full object-cover" />
        <div v-else>
          <LoadingOutlined v-if="isCoverUploading" />
          <PlusOutlined v-else />
          <div class="ant-upload-text mt-2">上传封面</div>
        </div>
      </Upload>
    </FormItem>

    <FormItem label="画廊图片" name="gallery_image_ids">
      <Upload
        name="file"
        multiple
        :max-count="MAX_GALLERY_IMAGES"
        :file-list="galleryFileList"
        list-type="picture-card"
        :before-upload="(file) => beforeUpload(file, false)"
        :custom-request="galleryCustomRequest"
        @change="handleGalleryChange"
      >
        <div>
          <PlusOutlined />
          <div style="margin-top: 8px">上传图片</div>
        </div>
      </Upload>
    </FormItem>

    <FormItem label="分类" name="category_ids">
      <TreeSelect
        v-model:value="formState.category_ids"
        :tree-data="limitedTreeData"
        :field-names="{ label: 'name', value: 'id', children: 'children' }"
        tree-default-expand-all
        multiple
        allow-clear
        placeholder="为菜谱选择一个或多个分类 (最多5个)"

        show-search
        tree-node-filter-prop="name"
      />
    </FormItem>

    <FormItem label="标签" name="tags">
      <Select
        v-model:value="formState.tags"
        mode="tags"
        placeholder="输入或搜索标签，按回车创建 (最多8个)"
        :options="tagOptions"
        :field-names="{ label: 'name', value: 'id' }"
        :filter-option="false"
        :loading="tagSearching"
        @search="handleTagSearch"
      />
    </FormItem>
  </Form>
</template>
