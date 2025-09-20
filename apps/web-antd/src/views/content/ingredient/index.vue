<script lang="ts" setup>
import { onMounted, h, ref, computed } from 'vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Table,
  Space,
  Tooltip,
  RadioGroup,
  RadioButton,
  Tag
} from 'ant-design-vue';
import { SyncOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';
// [核心] 导入我们刚刚创建的 useIngredientManagement
import { useIngredientManagement } from './useIngredientManagement';
// [核心] 导入子组件 (你需要自己创建它们，可以参考Tag模块)
import IngredientDrawer from './IngredientDrawer.vue';
import MergeIngredientsModal from './MergeIngredientsModal.vue';
// [核心] 导入 Ingredient 相关的类型
import type { IngredientRead } from './types';
import { $t } from '#/locales';

// =================================================================
//                      1. 实例化核心逻辑
// =================================================================
const {
  loading,
  tableData,
  searchParams,
  pagination,
  selectedRowKeys,
  hasSelected,
  handleTableChange,
  handleSearch,
  handleReset,
  handleDeleteIngredient,
  handleBatchSoftDelete,
  handleRestoreIngredients,
  handlePermanentDeleteIngredients,
  fetchData,
} = useIngredientManagement();

// =================================================================
//                      2. 组件引用和交互
// =================================================================
const drawerRef = ref<InstanceType<typeof IngredientDrawer> | null>(null);
const mergeModalRef = ref<InstanceType<typeof MergeIngredientsModal> | null>(null);

const openDrawer = (mode: 'create' | 'update', record?: IngredientRead) => {
  drawerRef.value?.open(mode, record);
};

const openMergeModal = () => {
  if (selectedRowKeys.value.length > 0) { // 合并可以从1个源开始
    const selectedItems = tableData.items.filter(item => selectedRowKeys.value.includes(item.id));
    mergeModalRef.value?.open(selectedItems);
  } else {
    mergeModalRef.value?.open();
  }
};

const canMerge = computed(() => selectedRowKeys.value.length > 0);

// =================================================================
//                      3. 表格列定义
// =================================================================
const columns: TableColumnType<IngredientRead>[] = [
  { title: '食材名称', dataIndex: 'name', key: 'name', sorter: true },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  {
    title: '状态',
    dataIndex: 'is_deleted',
    key: 'status',
    width: 100,
    align: 'center',
    customRender: ({ record }) => {
      const status = record.is_deleted;
      const color = status ? 'gray' : 'green';
      const text = status ? '已删除' : '活跃';
      return h(Tag, { color }, () => text);
    },
  },
  { title: '菜谱引用数', dataIndex: 'recipe_count', key: 'recipe_count', sorter: true, width: 120, align: 'center' },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 200, sorter: true, customRender: ({ text }) => new Date(text).toLocaleString() },
  { title: '操作', key: 'action', width: 180, fixed: 'right', align: 'center' },
];

onMounted(fetchData);
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline">
        <FormItem label="查看模式">
          <RadioGroup v-model:value="searchParams.view_mode" button-style="solid" @change="handleSearch">
            <RadioButton value="active">只看活跃</RadioButton>
            <RadioButton value="all">查看全部</RadioButton>
            <RadioButton value="deleted">回收站</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label="搜索">
          <Input
            v-model:value="searchParams.search"
            placeholder="按名称模糊搜索"
            allow-clear
            @pressEnter="handleSearch"
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
          <Button type="primary" @click="openDrawer('create')">新增食材</Button>
          <Button
            type="primary"
            @click="openMergeModal"
            :disabled="!canMerge || searchParams.view_mode !== 'active'"
          >
            合并食材
          </Button>

          <template v-if="searchParams.view_mode === 'active'">
            <Button type="primary" danger :disabled="!hasSelected" @click="handleBatchSoftDelete">批量删除</Button>
          </template>
          <template v-if="searchParams.view_mode === 'deleted'">
            <Button type="primary" :disabled="!hasSelected" @click="() => handleRestoreIngredients(selectedRowKeys)">批量恢复</Button>
            <Button type="primary" danger :disabled="!hasSelected" @click="() => handlePermanentDeleteIngredients(selectedRowKeys)">批量永久删除</Button>
          </template>

          <span v-if="hasSelected" class="text-gray-500 text-sm">已选择 {{ selectedRowKeys.length }} 项</span>
        </Space>
        <Tooltip title="刷新">
          <Button shape="circle" :icon="h(SyncOutlined)" :loading="loading" @click="fetchData" />
        </Tooltip>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData.items"
        :pagination="pagination"
        :loading="loading"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: (keys) => selectedRowKeys = keys as string[] }"
        row-key="id"
        bordered
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Space v-if="!record.is_deleted">
              <Button type="link" size="small" @click="openDrawer('update', record)">编辑</Button>
              <Button type="link" danger size="small" @click="handleDeleteIngredient(record)">删除</Button>
            </Space>
            <Space v-else>
              <Button type="link" size="small" @click="() => handleRestoreIngredients([record.id])">恢复</Button>
              <Button type="link" danger size="small" @click="() => handlePermanentDeleteIngredients([record.id], record.name)">永久删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <IngredientDrawer ref="drawerRef" @success="handleSearch" />
    <MergeIngredientsModal ref="mergeModalRef" @success="handleSearch" />
  </div>
</template>
