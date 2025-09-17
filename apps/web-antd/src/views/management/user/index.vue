<script lang="ts" setup>
import {computed, h, ref} from 'vue';
import {
  Avatar, // <--- 在这里添加 Avatar
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
  RadioGroup,   // <--- 【新增】
  RadioButton,  // <--- 【新增】
} from 'ant-design-vue';
import {
  SyncOutlined,
  QuestionCircleOutlined,
  UserOutlined, // <--- 在這裡添加
} from '@ant-design/icons-vue';
import type { TableColumnType } from 'ant-design-vue';

import { useUserManagement } from './useUserManagement';
import UserDrawer from './userDrawer.vue';
import type { UserReadWithRoles } from './types';
import {useAuthStore} from "#/store";

// 【修改2】实例化 authStore 以便在模板中使用
const authStore = useAuthStore();
const {
  loading,
  tableData,
  rolesForSelector,
  pagination,
  searchParams,
  selectedRowKeys, // 2. 从 hook 中解构出 selectedRowKeys
  handleTableChange,
  handleSearch,
  handleReset,
  handleDeleteUser,
  handleBatchDelete, // 3. 从 hook 中解构出 handleBatchDelete
  handleRestore,
  handlePermanentDeactivate,
  handleRestoreUser,
  fetchData,
} = useUserManagement();

// 4. 定义 rowSelection 配置对象，使其与 selectedRowKeys 双向绑定
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
}));

// 5. 计算属性，判断是否有行被选中
const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const userDrawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);

const openDrawer = (mode: 'create' | 'update', record?: UserReadWithRoles) => {
  userDrawerRef.value?.open(mode, record);
};

const formatDateTime = (date: string | null | undefined) =>
  date ? new Date(date).toLocaleString('zh-CN', { hour12: false }) : '-';

const createColumns = (): TableColumnType<UserReadWithRoles>[] => [
  { title: '头像', dataIndex: 'full_avatar_url', key: 'avatar', width: 80, fixed: 'left', align: 'center' },
  { title: '用户名', dataIndex: 'username', key: 'username', width: 120, fixed: 'left', sorter: true, align: 'center' },
  { title: '角色', dataIndex: 'roles', key: 'roles', width: 180, align: 'center' },
  {
    title: '状态',
    key: 'status',
    width: 100,
    align: 'center',
    customRender: ({ record }) => {
      if (record.is_deleted) {
        return h(Tag, { color: 'gray' }, () => '已删除');
      }
      const color = record.is_active ? 'success' : 'error';
      const text = record.is_active ? '启用' : '禁用';
      return h(Tag, { color }, () => text);
    },
  },
  { title: '超级用户', dataIndex: 'is_superuser', key: 'is_superuser', width: 110, sorter: true, align: 'center' },
  { title: '已锁定', dataIndex: 'is_locked', key: 'is_locked', width: 100, sorter: true, align: 'center' },
  { title: '已验证', dataIndex: 'is_verified', key: 'is_verified', width: 100, sorter: true, align: 'center' },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 220, sorter: true, align: 'center' },
  { title: '全名', dataIndex: 'full_name', key: 'full_name', width: 120, sorter: true, align: 'center' },
  { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', width: 180, sorter: true, align: 'center' },
  {
    title: '相关时间',
    key: 'relevant_time',
    width: 180,
    sorter: true, // 你可能需要调整这里的 sorter 逻辑
    align: 'center',
    customRender: ({ record }) => {
      // 在回收站视图，优先显示删除时间
      if (searchParams.value.view_mode === 'deleted' && record.deleted_at) {
        return h('div', [
          h('div', formatDateTime(record.deleted_at)),
          h(Tag, { color: 'red', style: { marginTop: '4px' } }, () => '删除时间'),
        ]);
      }
      // 否则显示更新时间
      return h('div', [
        h('div', formatDateTime(record.updated_at)),
        h(Tag, { style: { marginTop: '4px' } }, () => '更新时间'),
      ]);
    },
  },
  { title: '操作', key: 'action', dataIndex: 'action', width: 130, fixed: 'right', align: 'center' },
];

const columns = createColumns();
</script>

<template>
  <div class="p-4">
    <Card :bordered="false" class="mb-4">
      <Form :model="searchParams" layout="inline" class="flex flex-wrap gap-x-4">
        <FormItem v-if="authStore.isSuperuser" label="查看模式">
          <RadioGroup v-model:value="searchParams.view_mode" button-style="solid" @change="handleSearch">
            <RadioButton value="active">常规视图</RadioButton>
            <RadioButton value="all">全部用户</RadioButton>
            <RadioButton value="deleted">回收站</RadioButton>
          </RadioGroup>
        </FormItem>
        <FormItem label="用户名">
          <Input v-model:value="searchParams.username" placeholder="模糊搜索用户名" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem label="邮箱">
          <Input v-model:value="searchParams.email" placeholder="模糊搜索邮箱" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem label="手机号">
          <Input v-model:value="searchParams.phone" placeholder="模糊搜索手机号" allow-clear @pressEnter="handleSearch" />
        </FormItem>
        <FormItem label="角色">
          <Select
            v-model:value="searchParams.role_ids"
            mode="multiple"
            :options="rolesForSelector"
            :field-names="{ label: 'name', value: 'id' }"
            placeholder="请选择角色"
            style="width: 200px"
            allow-clear
            max-tag-count="responsive"
          />
        </FormItem>
        <FormItem label="状态">
          <Select v-model:value="searchParams.is_active" placeholder="请选择状态" style="width: 120px" allow-clear>
            <Select.Option :value="true">启用</Select.Option>
            <Select.Option :value="false">禁用</Select.Option>
          </Select>
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
          <Button type="primary" @click="openDrawer('create')">新增用户</Button>
          <template v-if="searchParams.view_mode !== 'deleted'">
            <Popconfirm
              title="确定要将选中的用户移入回收站吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleBatchDelete"
            >
              <Button type="danger" :disabled="!hasSelected">批量删除</Button>
            </Popconfirm>
          </template>

          <template v-if="searchParams.view_mode === 'deleted'">
            <Button type="primary" ghost :disabled="!hasSelected" @click="handleRestore">
              批量恢复
            </Button>
            <Popconfirm
              title="此操作不可逆！将永久匿名化用户，确定吗？"
              ok-text="确定永久停用"
              cancel-text="取消"
              @confirm="handlePermanentDeactivate"
            >
              <Button type="danger" ghost :disabled="!hasSelected">
                永久停用
              </Button>
            </Popconfirm>
          </template>
          <span v-if="hasSelected" class="text-gray-500 text-sm">
            已选择 {{ selectedRowKeys.length }} 项
          </span>
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
        :row-selection="rowSelection"
        row-key="id"
        bordered
        size="small"
        :scroll="{ x: 1800 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <Avatar :src="record.full_avatar_url">
              <template #icon><UserOutlined /></template>
            </Avatar>
          </template>
          <template v-if="column.key === 'roles'">
            <div v-if="record.roles?.length" class="flex flex-wrap gap-1">
              <Tag v-for="role in record.roles" :key="role.id" color="blue">
                {{ role.name }}
              </Tag>
            </div>
            <span v-else>-</span>
          </template>

          <template v-if="column.key === 'is_active'">
            <Tag :color="record.is_active ? 'success' : 'error'">
              {{ record.is_active ? '启用' : '禁用' }}
            </Tag>
          </template>

          <template v-if="column.key === 'is_superuser'">
            <Tag v-if="record.is_superuser" color="gold">是</Tag>
            <span v-else>否</span>
          </template>

          <template v-if="column.key === 'is_locked'">
            <Tag v-if="record.is_locked" color="warning">是</Tag>
            <span v-else>否</span>
          </template>

          <template v-if="column.key === 'is_verified'">
            <Tag v-if="record.is_verified" color="processing">是</Tag>
            <span v-else>否</span>
          </template>

          <template v-if="['last_login_at', 'updated_at', 'created_at'].includes(column.key as string)">
            <span>{{ formatDateTime(record[column.dataIndex as keyof UserReadWithRoles]) }}</span>
          </template>

          <template v-if="column.key === 'action'">
            <Space>
              <template v-if="!record.is_deleted">
                <Button type="link" size="small" @click="openDrawer('update', record)">编辑</Button>
                <Popconfirm
                  title="确定要将此用户移入回收站吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDeleteUser(record)"
                >
                  <template #icon><QuestionCircleOutlined style="color: red" /></template>
                  <Button type="link" danger size="small">删除</Button>
                </Popconfirm>
              </template>

              <template v-else>
                <Button type="link" size="small" @click="handleRestoreUser(record)">恢复</Button>
              </template>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <UserDrawer ref="userDrawerRef" @success="handleSearch" />
  </div>
</template>
