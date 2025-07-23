<script setup lang="ts">
import { onMounted } from 'vue';
import { Card, Tabs, TabPane } from 'ant-design-vue';
import { useProfileManagement } from './useProfileManagement';
import BasicInfo from './components/BasicInfo.vue';
import SecuritySettings from './components/SecuritySettings.vue';

const {
  loading,
  profileData,
  fetchProfile,
  handleUpdateProfile,
  handleChangePassword,
  handleUpdateAvatar,
} = useProfileManagement();

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <div class="p-4 md:p-6">
    <Card :bordered="false" title="个人中心" class="!mb-4">
      <p>在这里，您可以管理您的个人资料、更新安全设置以及查看账户相关信息。</p>
    </Card>

    <Card :bordered="false">
      <Tabs tab-position="left">
        <TabPane key="basic" tab="基本资料">
          <BasicInfo
            :profile-data="profileData"
            :loading="loading"
            @update-profile="handleUpdateProfile"
            @update-avatar="handleUpdateAvatar"
          />
        </TabPane>
        <TabPane key="security" tab="安全设置">
          <SecuritySettings
            :loading="loading"
            @change-password="handleChangePassword"
          />
        </TabPane>
      </Tabs>
    </Card>
  </div>
</template>
