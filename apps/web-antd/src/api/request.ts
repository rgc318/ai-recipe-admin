/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    paramsSerializer: 'repeat',
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    try {
      console.warn('Access token or refresh token is invalid or expired. ');
      const accessStore = useAccessStore();
      const authStore = useAuthStore();
      accessStore.setAccessToken(null);
      if (
        preferences.app.loginExpiredMode === 'modal' &&
        accessStore.isAccessChecked
      ) {
        accessStore.setLoginExpired(true);
      } else {
        await authStore.logout();
      }
    } catch (e) {
      console.error('Error occurred inside doReAuthenticate:', e); // 添加 catch 来捕获内部错误
      throw e; // 重新抛出以维持原有逻辑
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.access_token;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }
  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
      shouldReAuthenticate: (error) => {
        const config = error?.config || {};
        // 如果导致 401 的请求是 logout 接口，则【不要】启动重认证流程
        if (config.url?.includes('/auth/logout')) {
          return false;
        }
        // 对于所有其他接口的 401，正常启动重认证流程
        return true;
      },
    }),
  );

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      // 如果是注册接口，不添加 token
      if (!config.url?.includes('/auth/register')) {
        config.headers.Authorization = formatToken(accessStore.accessToken);
      }

      // config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });





  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {

      const config = error?.config || {};
      const status = error?.response?.status;

      if (status === 401) {
        console.warn('Request failed with 401. Re-authentication triggered. No additional message shown.');
        return; // 直接返回，不执行下面的 message.error
      }
      if (!error?.response) {
        console.error('An unexpected non-HTTP error occurred:', error);
        // 你可以决定是否给用户一个通用的程序错误提示
        message.error('发生未知程序错误，请联系技术支持。');
        return;
      }
      // 如果请求的是 logout 接口，并且返回了 401 错误，
      // 我们就“静默”处理它，不弹出全局错误提示。
      if (config.url?.includes('/auth/logout') && status === 401) {
        // 直接返回，不执行下面的 message.error
        return;
      }
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? '';
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
