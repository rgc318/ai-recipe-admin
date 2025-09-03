<script lang="ts" setup>
import { ref, h, computed } from 'vue';
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
import { UploadOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { storeToRefs } from 'pinia';
import { debounce } from 'lodash-es';

import { useRecipeReferenceStore } from '#/store/modules/recipeReference';
import { searchTags } from '#/api/recipes/tag';
import type { TagRead, RecipeCreateData, FileRecordRead } from '../types';

// --- 组件通信: v-model ---
const props = defineProps<{
  modelValue: RecipeCreateData;
}>();
const emit = defineEmits(['update:modelValue']);

// --- 使用 computed 属性代理 v-model ---
const formState = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

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

// 封面上传逻辑
function handleCoverUpload(info: UploadChangeParam) {
  if (info.file.status === 'done') {
    const fileRecord = info.file.response?.data as FileRecordRead;
    if (fileRecord?.id) {
      formState.value.cover_image_id = fileRecord.id;
      message.success(`封面 [${info.file.name}] 上传成功`);
    } else {
      message.error('上传成功，但未返回有效的图片ID');
    }
  } else if (info.file.status === 'error') {
    message.error(`封面 [${info.file.name}] 上传失败`);
  }
}

// 【新增】画廊图片上传/删除逻辑
function handleGalleryChange({ file, fileList }: UploadChangeParam) {
  if (file.status === 'done') {
    const fileRecord = file.response?.data as FileRecordRead;
    if (!fileRecord?.id) {
      message.error('上传成功，但未返回有效的图片ID');
      // 将上传失败的文件从列表中移除
      fileList.pop();
    }
    message.success(`图片 [${file.name}] 上传成功`);
  } else if (file.status === 'error') {
    message.error(`图片 [${file.name}] 上传失败`);
  }

  // 无论成功、失败还是删除，都根据当前的 fileList 重新生成 ID 列表
  const newImageIds: string[] = fileList
    .map(f => f.response?.data?.id || f.uid) // 优先用新上传的ID，否则用已存在的ID (uid)
    .filter(id => !!id);

  formState.value.gallery_image_ids = newImageIds;
}

// 【新增】将图片ID映射为 antd Upload 组件需要的 fileList 格式
// TODO: 为了预览，你可能需要一个API，能根据ID列表批量获取文件的URL
function mapIdsToFileList(image_ids: string[] = []): UploadFile[] {
  return image_ids.map(id => ({
    uid: id,
    name: `image_${id.substring(0, 6)}.jpg`,
    status: 'done',
    url: ``, // 留空或指向一个默认的“加载中”图片
  }));
}

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
        :show-upload-list="false"
        action="/api/v1/files/upload?profile=recipes"
        @change="handleCoverUpload"
      >
        <Button :icon="h(UploadOutlined)">上传封面</Button>
      </Upload>
      <p v-if="formState.cover_image_id" class="text-gray-500 text-sm mt-2">
        当前封面ID: {{ formState.cover_image_id }}
      </p>
    </FormItem>

    <FormItem label="画廊图片" name="gallery_image_ids">
      <Upload
        name="file"
        multiple
        list-type="picture-card"
        action="/api/v1/files/upload?profile=recipes"
        :file-list="mapIdsToFileList(formState.gallery_image_ids)"
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
        :tree-data="allCategories"
        :field-names="{ label: 'name', value: 'id', children: 'children' }"
        tree-default-expand-all
        multiple
        allow-clear
        placeholder="为菜谱选择一个或多个分类"

        show-search
        tree-node-filter-prop="name"
      />
    </FormItem>

    <FormItem label="标签" name="tags">
      <Select
        v-model:value="formState.tags"
        mode="tags"
        placeholder="输入或搜索标签，按回车创建新标签"
        :options="tagOptions"
        :field-names="{ label: 'name', value: 'id' }"
        :filter-option="false"
        :loading="tagSearching"
        @search="handleTagSearch"
      />
    </FormItem>
  </Form>
</template>
