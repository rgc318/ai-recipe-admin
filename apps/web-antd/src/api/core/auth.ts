import camelcaseKeys from 'camelcase-keys'; // 新增

import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 注册参数 */
  export interface RegisterParams {
    username?: string;
    password?: string;
    confirmPassword?: string;
    agreePolicy?: boolean;
  }

  /** 注册返回结果（根据你后端接口返回结构定义） */
  export interface RegisterResult {
    userId: string;
    username: string;
    message?: string;
  }
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const res = await requestClient.post('/auth/login', data);
  return camelcaseKeys(res, { deep: true }) as AuthApi.LoginResult;
}

/**
 * 注册接口
 * @param data 用户注册表单数据
 */
export async function registerApi(data: AuthApi.RegisterParams) {
  const res = await requestClient.post('/auth/register', data);
  return camelcaseKeys(res, { deep: true }) as AuthApi.RegisterResult;
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
