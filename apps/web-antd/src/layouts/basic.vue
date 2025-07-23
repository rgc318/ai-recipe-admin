<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, ref, watch } from 'vue';
// =================================================================
// ▼▼▼ 1. 导入 useRouter 和新图标 ▼▼▼
// =================================================================
import { useRouter } from 'vue-router';
import { UserOutlined } from '@ant-design/icons-vue';
// =================================================================

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { VBEN_DOC_URL, VBEN_GITHUB_URL } from '@vben/constants';
import { useWatermark } from '@vben/hooks';
import { BookOpenText, CircleHelp, MdiGithub } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([
  {
    avatar: 'https://avatar.vercel.sh/vercel.svg?text=VB',
    date: '3小时前',
    isRead: true,
    message: '描述信息描述信息描述信息',
    title: '收到了 14 份新周报',
  },
  {
    avatar: 'https://avatar.vercel.sh/1',
    date: '刚刚',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '朱偏右 回复了你',
  },
  {
    avatar: 'https://avatar.vercel.sh/1',
    date: '2024-01-01',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '曲丽丽 评论了你',
  },
  {
    avatar: 'https://avatar.vercel.sh/satori',
    date: '1天前',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '代办提醒',
  },
]);

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);
// =================================================================
// ▼▼▼ 2. 获取 router 实例，并修改 menus 数组 ▼▼▼
// =================================================================
const router = useRouter(); // 获取 router 实例

// 动态计算用户头像
const userAvatar = computed(() => {
  // 假设后端返回的头像是 full_avatar_url
  return userStore.userInfo?.full_avatar_url ?? preferences.app.defaultAvatar;
});

// 动态计算用户显示名 (优先用 realName/full_name，其次用 username)
const userDisplayName = computed(() => {
  return userStore.userInfo?.realName || userStore.userInfo?.username || '用户';
});

// 动态计算用户邮箱/描述
const userDescription = computed(() => {
  return userStore.userInfo?.email || '未设置邮箱';
});

// 动态计算用户标签 (如果是超级用户，则显示 'Superuser')
const userTagText = computed(() => {
  return userStore.userInfo?.is_superuser ? 'Superuser' : '';
});

const menus = computed(() => [
  {
    key: 'profile', // 新增 key
    // 新增“个人中心”菜单项
    handler: () => {
      router.push('/profile/index'); // 点击时跳转到我们定义的路由
    },
    icon: UserOutlined, // 使用新导入的图标
    text: $t('page.profile.title'), // 使用我们配置的 i18n
    divider: true, // 在下方添加一条分割线
  },
  {
    key: 'docs', // 新增 key
    handler: () => {
      openWindow(VBEN_DOC_URL, {
        target: '_blank',
      });
    },
    icon: BookOpenText,
    text: $t('ui.widgets.document'),
  },
  {
    key: 'github', // 新增 key
    handler: () => {
      openWindow(VBEN_GITHUB_URL, {
        target: '_blank',
      });
    },
    icon: MdiGithub,
    text: 'GitHub',
  },
  {
    key: 'qa', // 新增 key
    handler: () => {
      openWindow(`${VBEN_GITHUB_URL}/issues`, {
        target: '_blank',
      });
    },
    icon: CircleHelp,
    text: $t('ui.widgets.qa'),
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.full_avatar_url  ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}
watch(
  () => preferences.app.watermark,
  async (enable) => {
    if (enable) {
      await updateWatermark({
        content: `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar="userAvatar"
        :menus="menus"
        :text="userDisplayName"
        :description="userDescription"
        :tag-text="userTagText"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @make-all="handleMakeAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
