<script lang="ts" setup>
import { h, ref } from 'vue';
import {
  Avatar,
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Popconfirm,
  Select,
  Table,
  Tag,
  Space,
  Tooltip,
  TreeSelect,
  RadioGroup,
  RadioButton
} from 'ant-design-vue';
import { SyncOutlined, QuestionCircleOutlined, PictureOutlined } from '@ant-design/icons-vue';
import { useRecipeManagement } from './useRecipeManagement';
import type { TableColumnType } from 'ant-design-vue';
import type { RecipeRead, TagRead } from './types';
import { debounce } from 'lodash-es';
import { searchTags } from '#/api/content/tag';

const {
  loading,
  tableData,
  pagination,
  searchParams,
  categoriesForSelector, // 这个现在是树形结构
  selectedRowKeys,
  hasSelected,
  rowSelection,
  handleTableChange,
  handleSearch,
  handleReset,
  handleCreate,
  handleEdit,
  handleDelete,
  handleBatchDelete,
  handleRestoreRecipes,         // <-- 引入
  handlePermanentDeleteRecipes,   // <-- 引入
  refreshData,
} = useRecipeManagement();

// 标签筛选器的远程搜索逻辑 (保持不变, 设计得很好)
const tagFilterOptions = ref<TagRead[]>([]);
const tagFilterSearching = ref(false);

const handleTagFilterSearch = debounce(async (query: string) => {
  if (!query) {
    tagFilterOptions.value = [];
    return;
  }
  tagFilterSearching.value = true;
  try {
    const response = await searchTags({ name: query });
    tagFilterOptions.value = response.items;
  } finally {
    tagFilterSearching.value = false;
  }
}, 300);

const formatDateTime = (date: string | null | undefined) =>
  date ? new Date(date).toLocaleString('zh-CN', { hour12: false }) : '-';

// 【核心修改】重新定义表格的列
const columns: TableColumnType<RecipeRead>[] = [
  { title: '封面', dataIndex: 'cover_image', key: 'cover', width: 80, fixed: 'left', align: 'center' },
  { title: '菜谱标题', dataIndex: 'title', key: 'title', width: 250, fixed: 'left', sorter: true },
  {
    title: '状态',
    dataIndex: 'is_deleted',
    key: 'status',
    width: 100,
    align: 'center',
    customRender: ({ record }) => {
      const isDeleted = record.is_deleted;
      const color = isDeleted ? 'gray' : 'green';
      const text = isDeleted ? '已删除' : '活跃';
      return h(Tag, { color }, () => text);
    },
  },
  { title: '分类', dataIndex: 'categories', key: 'categories', width: 200, align: 'center' },
  { title: '标签', dataIndex: 'tags', key: 'tags', width: 220, align: 'center' },
  { title: '准备时间', dataIndex: 'prep_time', key: 'prep_time', width: 120, align: 'center' },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180, sorter: true, align: 'center' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180, sorter: true, align: 'center' },
  { title: '操作', key: 'action', width: 130, fixed: 'right', align: 'center' },
  // 已移除 "状态" 和 "作者" 列
];
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline" class="flex flex-wrap gap-x-4">
        <FormItem label="查看模式">
          <RadioGroup v-model:value="searchParams.view_mode" button-style="solid" @change="handleSearch">
            <RadioButton value="active">只看活跃</RadioButton>
            <RadioButton value="all">查看全部</RadioButton>
            <RadioButton value="deleted">回收站</RadioButton>
          </RadioGroup>
        </FormItem>

        <FormItem label="标题">
          <Input v-model:value="searchParams.title" placeholder="模糊搜索标题" allow-clear @pressEnter="handleSearch" />
        </FormItem>

        <FormItem label="分类">
          <TreeSelect
            v-model:value="searchParams.category_ids"
            :tree-data="categoriesForSelector"
            :field-names="{ label: 'name', value: 'id', children: 'children' }"
            multiple
            tree-default-expand-all
            allow-clear
            placeholder="请选择分类"
            style="width: 200px"
          />
        </FormItem>

        <FormItem label="标签">
          <Select
            v-model:value="searchParams.tag_ids"
            mode="multiple"
            placeholder="搜索并选择标签"
            style="width: 200px"
            allow-clear
            :options="tagFilterOptions"
            :field-names="{ label: 'name', value: 'id' }"
            :filter-option="false"
            :loading="tagFilterSearching"
            @search="handleTagFilterSearch"
          />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" :loading="loading" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <Card :bordered="false">
      <div class="mb-4 flex justify-between items-center">
        <Space>
          <Button type="primary" @click="handleCreate">新建菜谱</Button>

          <template v-if="searchParams.view_mode === 'active'">
            <Popconfirm title="确定要将选中的菜谱移入回收站吗？" @confirm="handleBatchDelete">
              <Button type="danger" :disabled="!hasSelected">批量删除</Button>
            </Popconfirm>
          </template>

          <template v-if="searchParams.view_mode === 'deleted'">
            <Button type="primary" :disabled="!hasSelected" @click="() => handleRestoreRecipes(selectedRowKeys)">批量恢复</Button>
            <Button type="danger" :disabled="!hasSelected" @click="() => handlePermanentDeleteRecipes(selectedRowKeys)">批量永久删除</Button>
          </template>

          <span v-if="hasSelected" class="text-gray-500 text-sm">已选择 {{ selectedRowKeys.length }} 项</span>
        </Space>
        <Tooltip title="刷新">
          <Button shape="circle" :icon="h(SyncOutlined)" :loading="loading" @click="refreshData" />
        </Tooltip>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData.items"
        :pagination="pagination"
        :loading="loading"
        :row-selection="rowSelection"
        row-key="id"
        bordered
        size="small"
        :scroll="{ x: 1500 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cover'">
            <Avatar :size="48" shape="square" :src="record.cover_image?.url">
              <template #icon><PictureOutlined /></template>
            </Avatar>
          </template>

          <template v-if="column.key === 'categories'">
            <div v-if="record.categories?.length" class="flex flex-wrap gap-1">
              <Tag v-for="cat in record.categories" :key="cat.id">{{ cat.name }}</Tag>
            </div>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'tags'">
            <div v-if="record.tags?.length" class="flex flex-wrap gap-1">
              <Tag v-for="tag in record.tags.slice(0, 3)" :key="tag.id" color="blue">{{ tag.name }}</Tag>
              <Tooltip v-if="record.tags.length > 3" :title="record.tags.slice(3).map(t => t.name).join(', ')">
                <Tag>...</Tag>
              </Tooltip>
            </div>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'prep_time'">
            <span>{{ record.prep_time || '-' }}</span>
          </template>

          <template v-if="['updated_at', 'created_at'].includes(column.key as string)">
            <span>{{ formatDateTime(record[column.dataIndex as keyof RecipeRead]) }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <Space v-if="!record.is_deleted">
              <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
              <Popconfirm title="确定要将此菜谱移入回收站吗？" @confirm="handleDelete(record)">
                <template #icon><QuestionCircleOutlined style="color: red" /></template>
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>

            <Space v-else>
              <Button type="link" size="small" @click="() => handleRestoreRecipes([record.id])">恢复</Button>
              <Button type="link" danger size="small" @click="() => handlePermanentDeleteRecipes([record.id], record.title)">永久删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
