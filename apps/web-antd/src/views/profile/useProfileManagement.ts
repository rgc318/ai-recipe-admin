import { ref } from 'vue';
import { message } from 'ant-design-vue';
import type {
  UserReadWithRoles,
  UserUpdateProfileData,
  UserChangePasswordData,
} from '#/views/management/user/types';

// 使用 # 别名导入 API 函数
import { updateMyProfile, changeMyPassword } from '#/api/profile/profile';
import {getUserInfoApi} from "#/api";
import {useAuthStore} from "#/store";

export function useProfileManagement() {
  const loading = ref(false);
  const profileData = ref<UserReadWithRoles | null>(null);

  async function fetchProfile() {
    loading.value = true;
    try {
      const response = await getUserInfoApi();
      profileData.value = response;
    } catch (error) {
      message.error('个人资料加载失败');
      profileData.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function handleUpdateProfile(data: UserUpdateProfileData) {
    loading.value = true;
    try {
      const updatedUser = await updateMyProfile(data);
      profileData.value = updatedUser;
      message.success('个人资料更新成功！');
    } catch (error) {
      message.error('更新失败，请重试');
    } finally {
      loading.value = false;
    }
  }

  async function handleChangePassword(data: UserChangePasswordData) {
    loading.value = true;
    try {
      await changeMyPassword(data);
      message.success('密码修改成功！');
      setTimeout(() => {
        // 假设 authStore 是你全局状态管理的一部分，并且可以这样获取
        // 如果你的项目结构不同，请使用相应的方式调用 logout
        const authStore = useAuthStore();
        authStore.logout(); // 主动执行登出
      }, 3000);

      return true;
    } catch (error: any) {
      message.error(error.message || '操作失败，请重试');
      return false;
    } finally {
      loading.value = false;
    }
  }

  // async function handleAvatarLink(avatarDto: AvatarLinkDTO) {
  //   // 这个方法接收“登记”成功后的文件元数据，并将其与当前用户关联
  //   loading.value = true;
  //   try {
  //     // 调用 UserService 中的 link_new_avatar 对应的 API
  //     const updatedUser = await linkMyUploadedAvatar(avatarDto);
  //
  //     // 用后端返回的最新用户数据，更新本地状态
  //     profileData.value = updatedUser;
  //     message.success('头像更新成功！');
  //   } catch (error) {
  //     message.error('头像关联失败');
  //   } finally {
  //     loading.value = false;
  //   }
  // }


  function syncProfileData(updatedUser: UserReadWithRoles) {
    profileData.value = updatedUser;
  }

  return {
    loading,
    profileData,
    fetchProfile,
    handleUpdateProfile,
    handleChangePassword,
    syncProfileData,
  };
}
