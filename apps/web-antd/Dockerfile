# ./apps/web-antd/Dockerfile

# --- 阶段一：构建环境 (Builder) ---
FROM node:20-alpine AS builder
WORKDIR /app

# 正确的方式：启用 Node.js 内置的 Corepack
RUN corepack enable

# 复制整个项目的所有源代码
COPY . .

# 在仓库根目录的上下文中，安装所有依赖
RUN pnpm install



# 关键：在完整的环境中，只构建我们需要的 web-antd 子项目
RUN pnpm --filter web-antd build


# --- 阶段二：生产环境 (Production) ---
FROM nginx:alpine

# 从构建器阶段，只复制 web-antd 打包好的 dist 目录
COPY --from=builder /app/apps/web-antd/dist /usr/share/nginx/html

# 复制 Nginx 配置文件
COPY apps/web-antd/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
