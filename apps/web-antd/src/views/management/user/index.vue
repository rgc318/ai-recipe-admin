<script lang="ts" setup>
import { onActivated, onMounted, reactive, ref } from 'vue';
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
import { getUserList } from '#/api/management/user';
import UserDrawer from './userDrawer.vue';

// --- 状态管理 ---
const loading = ref(false);
const userDrawerRef = ref();
const searchParams = reactive({
  username: '',
  status: undefined, // 注意：这个字段在当前后端查询中未被使用，但保留UI
});
const tableData = ref([]);

// 优化分页对象，使其能接收并同步后端返回的完整分页信息
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  // 还可以添加后端返回的其他信息，虽然表格不直接用，但方便调试
  // totalPages: 0,
});

// --- 表格列定义 (已修正) ---
// dataIndex 与后端返回的字段名 (snake_case) 完全对应
const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '全名', dataIndex: 'full_name', key: 'full_name' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '状态', dataIndex: 'is_active', key: 'status' }, // key保持'status'以便模板中识别
  { title: '创建时间', dataIndex: 'created_at', key: 'createdAt' },
  { title: '操作', key: 'action', width: 160 },
];

// --- 核心逻辑 (已优化) ---
async function fetchData() {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      // 注意：请确保后端API接受的是 pageSize 或 page_size
      // 如果后端用的是 page_size, 这里应为 page_size: pagination.pageSize
      pageSize: pagination.pageSize,
      ...searchParams,
    };

    // response 是已经被拦截器解包后的 data 对象
    const response = await getUserList(params);
    console.log('API Response Data:', response); // 使用更清晰的日志

    if (response && response.items) {
      // 使用后端返回的正确键名 'items'
      tableData.value = response.items;
      // 用后端返回的真实分页数据同步前端状态，保证数据一致性
      pagination.total = response.total;
      pagination.current = response.page;
      pagination.pageSize = response.per_page;
    } else {
      // 防御性编程，清空数据
      tableData.value = [];
      pagination.total = 0;
    }
  } catch (error) {
    console.error('[index.vue] fetchData 中捕获到错误:', error);
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

// 搜索功能
function handleSearch() {
  pagination.current = 1; // 搜索时应重置到第一页
  fetchData();
}

// --- 操作处理函数 ---
function handleAddNew() {
  userDrawerRef.value?.open('create');
}

function handleEdit(record: any) {
  userDrawerRef.value?.open('update', record);
}

async function handleDelete(record: any) {
  try {
    console.log('正在删除用户:', record.id);
    // 替换为真实的删除API调用
    // await deleteUser(record.id);
    message.success('删除成功');
    // 如果当前页只剩一条数据且不是第一页，删除后应请求前一页
    if (tableData.value.length === 1 && pagination.current > 1) {
      pagination.current--;
    }
    fetchData(); // 重新加载数据
  } catch (error) {
    message.error('删除失败');
  }
}

// --- 生命周期钩子 (已优化) ---

// onMounted 只负责那些只需要在组件挂载时执行一次的逻辑
// 如果没有，可以留空或删除
onMounted(() => {
  console.log('用户管理页面已挂载 (onMounted)');
  fetchData();
});

// onActivated 统一负责数据加载，它在首次进入和后续从其他页面返回时都会触发
onActivated(() => {
  console.log('用户管理页面已激活 (onActivated)，开始获取数据...');
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
            @pressEnter="handleSearch"
          />
        </FormItem>
        <FormItem label="状态">
          <Select
            v-model:value="searchParams.status"
            placeholder="请选择状态"
            style="width: 120px"
            allow-clear
          >
            <Select.Option :value="true">启用</Select.Option>
            <Select.Option :value="false">禁用</Select.Option>
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
        bordered
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.is_active ? 'green' : 'red'">
              {{ record.is_active ? '启用' : '禁用' }}
            </Tag>
          </template>

          <template v-if="column.key === 'action'">
            <div class="flex items-center justify-start space-x-2">
              <Button type="link" size="small" @click="handleEdit(record)">
                编辑
              </Button>
              <Popconfirm
                title="确定要删除此用户吗？"
                ok-text="确定"
                cancel-text="取消"
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
