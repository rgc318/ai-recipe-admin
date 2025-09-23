import { defineConfig } from '@vben/vite-config';
import {loadEnv} from "vite";
import path from 'node:path';
// import vue from '@vitejs/plugin-vue';
// import vueJsx from '@vitejs/plugin-vue-jsx'; // <--- 1. 在这里引入插件
export default defineConfig(async ({ mode }) => {

  // process.cwd() 是项目根目录，mode 是当前模式 ('development' 或 'production')
  // 这行代码会根据模式加载正确的 .env 文件
  // 解析出项目根目录的绝对路径 (从当前目录往上找两级)
  const rootPath = path.resolve(process.cwd(), '../..');
  const env = loadEnv(mode, rootPath);

  return {
    application: {},
    vite: {
      resolve: {
        alias: {
          '#': '/src',  // 将 # 映射到 src 目录
        },
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            // target: 'http://localhost:5320/api',
            // target: 'http://localhost:8000/api/v1',
            // target: 'http://192.168.31.229:8000/api/v1',
            target: env.VITE_API_BASE_URL,
            ws: true,
          },
        },
      },
      // plugins: [
      //   vue(),
      //   vueJsx(), // <--- 2. 在这里添加插件
      //   // ... 其他插件
      // ],
    },
  };
});
