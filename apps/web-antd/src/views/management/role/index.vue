<script lang="ts" setup>
// 这部分代码你已修改正确，无需变动
import { computed, h, ref, onMounted } from 'vue';
import {
  Button, Card, Form, FormItem, Input, Table, Tag, Space, Popconfirm, Tooltip,
  RadioGroup, RadioButton,
} from 'ant-design-vue';
import { SyncOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';
import { useRoleManagement } from './useRoleManagement';
import RoleDrawer from './roleDrawer.vue';
import MergeRolesModal from './MergeRolesModal.vue';
import type { RoleReadWithPermissions } from './types';
import { useAuthStore } from '#/store';

const authStore = useAuthStore();
const {
  loading, tableData, searchParams, pagination,
  selectedRowKeys, hasSelected, rowSelection,
  handleTableChange, handleSearch, handleReset, handleDelete,
  handleBatchDelete, handleRestore, handlePermanentDelete,
  mergeModalRef, openMergeModal,
  handleRestoreRow,
  handlePermanentDeleteRow,
  refreshData,
} = useRoleManagement();

const roleDrawerRef = ref<InstanceType<typeof RoleDrawer> | null>(null);
const canMerge = computed(() => selectedRowKeys.value.length >= 2);

const openDrawer = (mode: 'create' | 'update', record?: RoleReadWithPermissions) => {
  roleDrawerRef.value?.open(mode, record);
};

const columns: TableColumnType<RoleReadWithPermissions>[] = [
  { title: '角色名称', dataIndex: 'name', key: 'name', width: 200, sorter: true },
  { title: '角色代码', dataIndex: 'code', key: 'code', width: 200, sorter: true, customRender: ({ text }) => h(Tag, { color: 'geekblue' }, () => text) },
  { title: '关联权限', dataIndex: 'permissions', key: 'permissions' },
  {
    title: '状态', key: 'status', width: 100, align: 'center',
    customRender: ({ record }) => {
      if (record.is_deleted) return h(Tag, { color: 'gray' }, () => '已删除');
      return h(Tag, { color: 'success' }, () => '活跃');
    },
  },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 200, sorter: true, customRender: ({ text }) => new Date(text).toLocaleString() },
  { title: '操作', key: 'action', width: 150, fixed: 'right', align: 'center' },
];

onMounted(refreshData);
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline">
        <FormItem v-if="authStore.isSuperuser" label="查看模式">
          <RadioGroup v-model:value="searchParams.view_mode" button-style="solid" @change="handleSearch">
            <RadioButton value="active">常规视图</RadioButton>
            <RadioButton value="all">全部</RadioButton>
            <RadioButton value="deleted">回收站</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label="搜索">
          <Input v-model:value="searchParams.search" placeholder="按名称/代码模糊搜索" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem><Space>
          <Button type="primary" :loading="loading" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space></FormItem>
      </Form>
    </Card>

    <Card :bordered="false">
      <div class="mb-4 flex justify-between items-center">
        <Space>
          <Button type="primary" @click="openDrawer('create')">新增角色</Button>

          <Button
            type="default"
            @click="openMergeModal"
            :disabled="searchParams.view_mode !== 'active' || !canMerge"
          >
            合并角色
          </Button>

          <template v-if="searchParams.view_mode === 'active'">
            <Popconfirm title="确定要将选中的角色移入回收站吗？" @confirm="handleBatchDelete">
              <Button type="danger" :disabled="!hasSelected">批量删除</Button>
            </Popconfirm>
          </template>

          <template v-if="searchParams.view_mode === 'deleted'">
            <Button type="primary" ghost :disabled="!hasSelected" @click="handleRestore">批量恢复</Button>
            <Popconfirm title="此操作不可逆！将永久删除角色，确定吗？" ok-text="确定永久删除" @confirm="handlePermanentDelete">
              <Button type="danger" ghost :disabled="!hasSelected">永久删除</Button>
            </Popconfirm>
          </template>

          <span v-if="hasSelected" class="text-gray-500 text-sm">
            已选择 {{ selectedRowKeys.length }} 项
          </span>
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
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'permissions'"><div v-if="record.permissions?.length" class="flex flex-wrap gap-1">
            <Tooltip v-for="perm in record.permissions.slice(0, 5)" :key="perm.id" :title="perm.description"><Tag color="blue">{{ perm.name }}</Tag></Tooltip>
            <Tooltip v-if="record.permissions.length > 5" :title="record.permissions.slice(5).map(p => p.name).join(', ')"><Tag>...</Tag></Tooltip>
          </div><span v-else>-</span></template>

          <template v-if="column.key === 'action'">
            <Space>
              <template v-if="!record.is_deleted">
                <Button type="link" size="small" @click="openDrawer('update', record)">编辑</Button>
                <Popconfirm title="确定要将此角色移入回收站吗？" @confirm="handleDelete(record)">
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </template>
              <template v-else>
                <Button type="link" size="small" @click="handleRestoreRow(record)">恢复</Button>
                <Popconfirm
                  title="此操作不可逆！确定要永久删除吗？"
                  ok-text="确定永久删除"
                  @confirm="handlePermanentDeleteRow(record)"
                >
                  <Button type="link" danger size="small">永久删除</Button>
                </Popconfirm>
              </template>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <RoleDrawer ref="roleDrawerRef" @success="refreshData" />
    <MergeRolesModal ref="mergeModalRef" @success="refreshData" />
  </div>
</template>
