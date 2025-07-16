import { defineConfig } from '@vben/vite-config';
// import vue from '@vitejs/plugin-vue';
// import vueJsx from '@vitejs/plugin-vue-jsx'; // <--- 1. 在这里引入插件
export default defineConfig(async () => {
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
            target: 'http://localhost:8000/api/v1',
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
