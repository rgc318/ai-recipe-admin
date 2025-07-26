<script lang="ts" setup>
import { h } from 'vue';
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
} from 'ant-design-vue';
import { SyncOutlined, QuestionCircleOutlined, UserOutlined } from '@ant-design/icons-vue';
import { useRecipeManagement } from './useRecipeManagement';
import type { TableColumnType } from 'ant-design-vue';
import type { RecipeRead } from './types';

const {
  loading,
  tableData,
  pagination,
  searchParams,
  categoriesForSelector,
  tagsForSelector,
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
  refreshData,
} = useRecipeManagement();

const formatDateTime = (date: string | null | undefined) =>
  date ? new Date(date).toLocaleString('zh-CN', { hour12: false }) : '-';

const columns: TableColumnType<RecipeRead>[] = [
  { title: '封面', dataIndex: 'cover_image_url', key: 'cover', width: 80, fixed: 'left', align: 'center' },
  { title: '菜谱标题', dataIndex: 'title', key: 'title', width: 250, fixed: 'left', sorter: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100, sorter: true, align: 'center' },
  { title: '分类', dataIndex: 'category', key: 'category', width: 150, align: 'center' },
  { title: '标签', dataIndex: 'tags', key: 'tags', width: 200, align: 'center' },
  { title: '作者', dataIndex: 'author', key: 'author', width: 120, sorter: true, align: 'center' },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180, sorter: true, align: 'center' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180, sorter: true, align: 'center' },
  { title: '操作', key: 'action', width: 130, fixed: 'right', align: 'center' },
];
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline" class="flex flex-wrap gap-x-4">
        <FormItem label="标题">
          <Input v-model:value="searchParams.title" placeholder="模糊搜索标题" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchParams.status" placeholder="请选择状态" style="width: 120px" allow-clear>
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="draft">草稿</Select.Option>
          </Select>
        </FormItem>
        <FormItem label="分类">
          <TreeSelect
            v-model:value="searchParams.category_id"
            :tree-data="categoriesForSelector"
            placeholder="请选择分类"
            tree-default-expand-all
            allow-clear
            style="width: 200px"
          />
        </FormItem>
        <FormItem label="标签">
          <Select
            v-model:value="searchParams.tag_ids"
            mode="multiple"
            :options="tagsForSelector"
            placeholder="请选择标签"
            style="width: 200px"
            allow-clear
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
          <Popconfirm title="确定要删除选中的菜谱吗？" @confirm="handleBatchDelete">
            <Button type="danger" :disabled="!hasSelected">批量删除</Button>
          </Popconfirm>
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
            <Avatar :size="48" shape="square" :src="record.cover_image_url">
              <template #icon><UserOutlined /></template>
            </Avatar>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'published' ? 'success' : 'processing'">
              {{ record.status === 'published' ? '已发布' : '草稿' }}
            </Tag>
          </template>
          <template v-if="column.key === 'category'">
            <span>{{ record.category?.name || '-' }}</span>
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
          <template v-if="column.key === 'author'">
            <span>{{ record.author?.username || '-' }}</span>
          </template>
          <template v-if="['updated_at', 'created_at'].includes(column.key as string)">
            <span>{{ formatDateTime(record[column.dataIndex as keyof RecipeRead]) }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleEdit(record)">编辑</Button>
              <Popconfirm title="确定要删除此菜谱吗？" @confirm="handleDelete(record)">
                <template #icon><QuestionCircleOutlined style="color: red" /></template>
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
