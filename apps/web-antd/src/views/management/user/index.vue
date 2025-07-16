<script lang="ts" setup>
import { onActivated, onMounted, reactive, ref } from 'vue';

// 1. 直接从 ant-design-vue 引入我们将要使用的所有原生组件
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  message,
  Popconfirm,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import { getUserList } from '#/api/management/user'; // 假设您的表单在 UserDrawer.vue 中

// 2. 引入我们自己的用户表单抽屉组件
import UserDrawer from './userDrawer.vue';

// --- 假设的 API 和类型 ---
// import { getUserList, deleteUser } from './api';
// import type { UserInfo } from './types';

// --- 状态管理 ---
const loading = ref(false);
const userDrawerRef = ref();
const searchParams = reactive({
  username: '',
  status: undefined,
});
const tableData = ref([]);
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

// --- 表格列定义 ---
const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'action', width: 160 },
];

// --- 核心逻辑 ---
async function fetchData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...searchParams,
    };

    // 调用 API，返回的是 StandardResponse
    const response = await getUserList(params);

    // 【重要修改】从 response.data 中解构出真正的列表和总数
    if (response && response.data) {
      tableData.value = response.data.list;
      pagination.total = response.data.total;
    } else {
      // 如果没有数据，进行防御性编程
      tableData.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    // 这一行会把捕获到的具体错误对象打印出来，颜色是红的，非常醒目
    console.error(
      '%c[index.vue] fetchData 中捕获到错误:',
      'color: red; font-size: 16px;',
      error,
    );
    message.error('数据加载失败');
    tableData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
}

// 表格变化处理（分页、排序等）
function handleTableChange(page: any) {
  pagination.current = page.current;
  pagination.pageSize = page.pageSize;
  fetchData();
}

function handleSearch() {
  pagination.current = 1;
  fetchData();
}

function handleAddNew() {
  userDrawerRef.value?.open('create');
}

function handleEdit(record: any) {
  userDrawerRef.value?.open('update', record);
}

async function handleDelete(record: any) {
  console.log('Deleting record:', record.id);
  // await deleteUser(record.id);
  message.success('删除成功');
  fetchData(); // 重新加载数据
}

// 当组件被激活时（包括首次进入和后续返回），加载数据
onMounted(() => {
  // 在这里放下我们的“探测器”
  console.log(
    '%c[onMounted] Hook has been triggered!',
    'color: lime; font-size: 16px; font-weight: bold;',
  );
  // 然后再调用我们原来的 fetchData 函数
  fetchData();
});

// 当组件被激活时（包括首次进入和后续返回），加载数据
onActivated(() => {
  // 在这里放下我们的“探测器”
  console.log(
    '%c[onActivated] Hook has been triggered!',
    'color: lime; font-size: 16px; font-weight: bold;',
  );

  // 然后再调用我们原来的 fetchData 函数
  fetchData();
});
</script>

<template>
  <div class="space-y-4 p-4">
    <Card>
      <Form :model="searchParams" layout="inline">
        <FormItem label="用户名">
          <Input
            v-model:value="searchParams.username"
            placeholder="请输入用户名"
          />
        </FormItem>
        <FormItem label="状态">
          <Select
            v-model:value="searchParams.status"
            placeholder="请选择状态"
            style="width: 120px"
            allow-clear
          >
            <Select.Option value="active">启用</Select.Option>
            <Select.Option value="inactive">禁用</Select.Option>
          </Select>
        </FormItem>
        <FormItem>
          <Button type="primary" @click="handleSearch">搜索</Button>
        </FormItem>
      </Form>
    </Card>

    <Card>
      <div class="mb-4">
        <Button type="primary" @click="handleAddNew">新增用户</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="tableData"
        :pagination="pagination"
        :loading="loading"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'active' ? 'green' : 'red'">
              {{ record.status === 'active' ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <div class="flex space-x-2">
              <Button type="link" size="small" @click="handleEdit(record)">
                编辑
              </Button>
              <Popconfirm
                title="确定要删除此用户吗？"
                @confirm="handleDelete(record)"
              >
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </div>
          </template>
        </template>
      </Table>
    </Card>

    <UserDrawer ref="userDrawerRef" @success="handleSearch" />
  </div>
</template>
